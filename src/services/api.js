// API 호출을 담당하는 서비스 모듈
class ApiService {
  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL
  }

  // 기본 fetch 요청 메서드
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }

    const config = {
      ...defaultOptions,
      ...options
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new ApiError(`HTTP error! status: ${response.status}`, response.status)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(`Network error: ${error.message}`, 0)
    }
  }

  // POST 요청 헬퍼 메서드
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // GET 요청 헬퍼 메서드
  async get(endpoint) {
    return this.request(endpoint, {
      method: 'GET'
    })
  }

  // PUT 요청 헬퍼 메서드
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // DELETE 요청 헬퍼 메서드
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    })
  }

  // 스트리밍 요청 메서드
  async streamRequest(endpoint, options = {}, onData = null, onError = null) {
    const url = `${this.baseURL}${endpoint}`
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...options.headers
      }
    }

    const config = {
      ...defaultOptions,
      ...options
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new ApiError(`HTTP error! status: ${response.status}`, response.status)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (onData) onData(data)
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', line)
            }
          }
        }
      }
    } catch (error) {
      if (onError) onError(error)
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(`Network error: ${error.message}`, 0)
    }
  }

  // base URL 설정
  setBaseURL(baseURL) {
    this.baseURL = baseURL
  }
}

// 커스텀 에러 클래스
class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// 기본 인스턴스 생성
const apiService = new ApiService()

export { apiService, ApiService, ApiError }