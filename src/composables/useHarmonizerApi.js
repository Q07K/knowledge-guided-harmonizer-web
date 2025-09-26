// API 호출을 위한 Vue Composable
import { ref } from 'vue'
import { harmonizerApi } from '../services/harmonizer.js'

export function useHarmonizerApi() {
  const loading = ref(false)
  const error = ref(null)
  const data = ref(null)

  // 에러 초기화
  const clearError = () => {
    error.value = null
  }

  // 데이터 초기화
  const clearData = () => {
    data.value = null
  }

  // init-message API 호출
  const initMessage = async (sqlQuery) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await harmonizerApi.initMessage(sqlQuery)
      data.value = response
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 시각화 데이터 가져오기
  const getVisualizationData = async (messageId) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await harmonizerApi.getVisualizationData(messageId)
      data.value = response
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 메타모델 정보 가져오기
  const getMetaModel = async (messageId) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await harmonizerApi.getMetaModel(messageId)
      data.value = response
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 일반 채팅
  const sendChatMessage = async (message) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await harmonizerApi.sendChatMessage(message)
      data.value = response
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 스트리밍 채팅
  const streamChat = async (message, onData, onError) => {
    loading.value = true
    error.value = null
    
    try {
      await harmonizerApi.streamChat(message, onData, (err) => {
        error.value = err.message
        if (onError) onError(err)
      })
    } catch (err) {
      error.value = err.message
      if (onError) onError(err)
    } finally {
      loading.value = false
    }
  }

  // API 호스트 설정
  const setApiHost = (host) => {
    harmonizerApi.setApiHost(host)
  }

  return {
    loading,
    error,
    data,
    clearError,
    clearData,
    initMessage,
    getVisualizationData,
    getMetaModel,
    sendChatMessage,
    streamChat,
    setApiHost
  }
}