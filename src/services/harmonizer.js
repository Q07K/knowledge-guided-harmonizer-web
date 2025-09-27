// Knowledge Guided Harmonizer API 서비스
import { apiService } from './api.js'

// 환경 변수에서 API URL 가져오기
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export class HarmonizerApiService {
  constructor() {
    // 기본 API URL 설정
    this.setApiHost(API_BASE_URL)
  }
  // SQL 쿼리를 초기화 메시지로 전송
  async initMessage(sqlQuery) {
    if (!sqlQuery || !sqlQuery.trim()) {
      throw new Error('SQL 쿼리가 비어있습니다.')
    }

    return await apiService.post('/init-message', {
      sqlQuery: sqlQuery.trim()
    })
  }

  // 시각화 데이터 요청 (예시)
  async getVisualizationData(messageId) {
    return await apiService.get(`/visualization/${messageId}`)
  }

  // 메타모델 정보 요청 (예시)
  async getMetaModel(messageId) {
    return await apiService.get(`/metamodel/${messageId}`)
  }

  // 일반 채팅 메시지 전송
  async sendChatMessage(message) {
    if (!message || !message.trim()) {
      throw new Error('메시지가 비어있습니다.')
    }

    return await apiService.post('/chat', {
      message: message.trim()
    })
  }

  // 스트리밍 채팅 메시지 전송
  async streamChat(message, onData, onError) {
    if (!message || !message.trim()) {
      throw new Error('메시지가 비어있습니다.')
    }

    return await apiService.streamRequest('/chat/stream', {
      method: 'POST',
      body: JSON.stringify({ message: message.trim() })
    }, onData, onError)
  }

  // init-message 스트리밍 요청
  async streamInitMessage(sqlQuery, onData, onError) {
    if (!sqlQuery || !sqlQuery.trim()) {
      throw new Error('SQL 쿼리가 비어있습니다.')
    }

    return await apiService.streamRequest('/init-message', {
      method: 'POST',
      body: JSON.stringify({ sqlQuery: sqlQuery.trim() })
    }, onData, onError)
  }

  // API 서버 URL 설정
  setApiHost(host) {
    apiService.setBaseURL(host)
  }
}

// 기본 인스턴스 생성 및 내보내기
export const harmonizerApi = new HarmonizerApiService()