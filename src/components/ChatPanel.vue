<template>
  <div class="chat-panel">
    <h2>AI 채팅</h2>
    
    <div class="chat-container">
      <div class="messages-container" ref="messagesContainer">
        <div 
          v-for="message in messages" 
          :key="message.id"
          :class="['message', message.type, message.messageClass]"
        >
          <div class="message-content">
            <div v-if="!message.isAnalysisButton" class="message-text">{{ message.text }}</div>
            <div v-else class="analysis-button-container">
              <button 
                @click="startAnalysis"
                :disabled="isLoading"
                class="analysis-button"
              >
                <span v-if="!isLoading">분석 시작</span>
                <span v-else>분석 중...</span>
              </button>
            </div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        
        <div v-if="isLoading" class="message ai">
          <div class="message-content">
            <!-- 스트리밍 중인 메시지가 있으면 표시 -->
            <div v-if="currentStreamingMessage" class="message-text streaming">
              {{ currentStreamingMessage }}
              <span class="cursor-blink">|</span>
            </div>
            <!-- 스트리밍 메시지가 없으면 타이핑 인디케이터 표시 -->
            <div v-else class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <!-- node state 표시 -->
            <div v-if="currentNodeState" class="node-state-indicator">
              <div class="node-state-badge">
                <span class="node-state-text">{{ currentNodeState }}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      <div class="input-container">
        <div class="input-wrapper">
          <textarea 
            v-model="currentMessage"
            @keydown="handleKeydown"
            placeholder="메시지를 입력하세요... (Shift+Enter로 새 줄, Enter로 전송)"
            class="message-input"
            ref="messageInput"
          ></textarea>
          <button 
            @click="sendMessage"
            :disabled="!currentMessage.trim() || isLoading"
            class="send-button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, onMounted, watch } from 'vue'
import { useHarmonizerApi } from '../composables/useHarmonizerApi.js'
import { validateSqlCreateTable } from './utils.js'

export default {
  name: 'ChatPanel',
  props: {
    sqlQuery: {
      type: String,
      default: ''
    },
    sqlValidation: {
      type: Object,
      default: null
    }
  },
  emits: ['start-analysis', 'visualization-data'],
  setup(props, { emit }) {
    const currentMessage = ref('')
    const messages = ref([])
    const isLoading = ref(false)
    const messagesContainer = ref(null)
    const messageInput = ref(null)
    const currentNodeState = ref('')
    const currentStreamingMessage = ref('')
    
    const { streamChat, initMessage, sendChatMessage } = useHarmonizerApi()
    
    let messageIdCounter = 0

    const addMessage = (text, type = 'user', messageClass = null) => {
      const message = {
        id: ++messageIdCounter,
        text,
        type,
        timestamp: new Date(),
        messageClass
      }
      messages.value.push(message)
      scrollToBottom()
    }

    const scrollToBottom = async () => {
      await nextTick()
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }

    const formatTime = (timestamp) => {
      return timestamp.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }

    const sendMessage = async () => {
      const message = currentMessage.value.trim()
      if (!message || isLoading.value) return

      // 사용자 메시지 추가
      addMessage(message, 'user')
      currentMessage.value = ''

      // AI 응답 처리
      isLoading.value = true
      currentNodeState.value = 'API 요청 중...'
      currentStreamingMessage.value = ''
      
      try {
        console.log('=== 실제 채팅 API 호출 ===')
        console.log('Message:', message)
        
        // 실제 채팅 API 호출
        const response = await sendChatMessage(message)
        console.log('Chat API Response:', response)
        
        // API 응답 처리
        await processApiResponse(response)
        
      } catch (error) {
        console.error('Chat API error:', error)
        currentNodeState.value = 'API 오류'
        
        let errorMessage = '채팅 API 호출에 실패했습니다.'
        if (error.message) {
          errorMessage += `\n오류: ${error.message}`
        }
        
        addMessage(errorMessage, 'ai')
        
      } finally {
        isLoading.value = false
        currentNodeState.value = ''
        currentStreamingMessage.value = ''
      }
    }







    const handleKeydown = (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        sendMessage()
      }
    }

    // 스트리밍 메시지 변경시 스크롤 업데이트
    watch(currentStreamingMessage, () => {
      scrollToBottom()
    })

    // node state 변경시 스크롤 업데이트
    watch(currentNodeState, () => {
      scrollToBottom()
    })

    // SQL 쿼리 상태에 따른 "분석 시작" 버튼 추가
    const addAnalysisButton = () => {
      const analysisMessage = {
        id: ++messageIdCounter,
        text: '',
        type: 'ai',
        timestamp: new Date(),
        isAnalysisButton: true
      }
      messages.value.push(analysisMessage)
      scrollToBottom()
    }

    // 분석 시작 처리 - 실제 /init-message API 호출
    const startAnalysis = async () => {
      if (!props.sqlQuery || !props.sqlQuery.trim()) {
        addMessage('SQL 쿼리가 입력되지 않았습니다. 먼저 SQL 쿼리를 입력해주세요.', 'ai')
        return
      }

      // SQL 검증 확인 (이미 실시간으로 검증된 결과 사용)
      if (!props.sqlValidation || !props.sqlValidation.isValid) {
        const validationResult = validateSqlCreateTable(props.sqlQuery)
        if (!validationResult.isValid) {
          addMessage(`SQL 검증 실패: ${validationResult.error}`, 'ai')
          return
        }
      }

      console.log('=== SQL 검증 통과, 실제 API 호출 시작 ===')
      console.log('SQL Query:', props.sqlQuery)
      
      // 분석 중 상태로 변경
      isLoading.value = true
      currentNodeState.value = 'API 연결 중...'
      currentStreamingMessage.value = ''
      
      try {
        // 실제 /init-message API 호출
        console.log('Calling /init-message API...')
        const response = await initMessage(props.sqlQuery)
        console.log('API Response:', response)
        
        // API 응답 파싱 및 화면 표시
        await processApiResponse(response)
        
      } catch (apiError) {
        console.error('API 호출 실패:', apiError)
        currentNodeState.value = 'API 오류'
        
        let errorMessage = 'API 호출에 실패했습니다.'
        if (apiError.message) {
          errorMessage += `\n오류: ${apiError.message}`
        }
        if (apiError.status) {
          errorMessage += `\n상태 코드: ${apiError.status}`
        }
        
        addMessage(errorMessage, 'ai')
        
      } finally {
        isLoading.value = false
        currentNodeState.value = ''
        currentStreamingMessage.value = ''
      }
    }

    // API 응답 처리 함수
    const processApiResponse = async (response) => {
      console.log('Processing API response:', response)
      
      // node_state 표시
      if (response.node_state) {
        currentNodeState.value = response.node_state
      } else if (response.status) {
        currentNodeState.value = response.status
      } else {
        currentNodeState.value = '분석 완료'
      }
      
      // 응답 메시지 구성
      let responseMessage = ''
      
      if (response.message) {
        responseMessage = response.message
      } else if (response.result) {
        responseMessage = response.result
      } else if (response.analysis) {
        responseMessage = response.analysis
      } else if (response.data) {
        responseMessage = typeof response.data === 'string' 
          ? response.data 
          : JSON.stringify(response.data, null, 2)
      } else {
        responseMessage = '분석이 완료되었습니다.\n\n' + JSON.stringify(response, null, 2)
      }
      
      // 메시지를 타이핑 효과로 표시
      if (responseMessage) {
        await typeMessage(responseMessage)
        addMessage(responseMessage, 'ai')
      }
      
      // 시각화 데이터 처리
      if (response.visualization_data) {
        console.log('Visualization data found:', response.visualization_data)
        emit('visualization-data', response.visualization_data)
      } else if (response.graph_data) {
        console.log('Graph data found:', response.graph_data)
        emit('visualization-data', response.graph_data)
      } else if (response.nodes && response.edges) {
        console.log('Nodes and edges found')
        emit('visualization-data', { nodes: response.nodes, edges: response.edges })
      } else if (response.ontology) {
        console.log('Ontology data found:', response.ontology)
        emit('visualization-data', response.ontology)
      }
    }

    // 타이핑 효과 함수
    const typeMessage = async (message) => {
      currentStreamingMessage.value = ''
      const words = message.split(' ')
      
      for (let i = 0; i < words.length; i++) {
        currentStreamingMessage.value = words.slice(0, i + 1).join(' ')
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 30)) // 빠른 타이핑
      }
    }

    // SQL 쿼리와 검증 결과 변경 감지
    watch([() => props.sqlQuery, () => props.sqlValidation], ([newQuery, validation]) => {
      // 기존 메시지 초기화
      messages.value = []
      messageIdCounter = 0
      
      if (newQuery && newQuery.trim()) {
        if (validation === null) {
          // 검증 중인 경우
          addMessage('SQL 쿼리 검증 중입니다...', 'ai', 'validating')
        } else if (validation && validation.isValid) {
          // 검증 성공한 경우
          addMessage('✅ SQL 쿼리가 유효합니다. 분석을 시작하시겠습니까?', 'ai', 'success')
          addAnalysisButton()
        } else if (validation && !validation.isValid) {
          // 검증 실패한 경우
          addMessage('올바른 CREATE TABLE 구문을 입력해주세요.', 'ai', 'error')
        } else {
          // 검증 결과가 없는 경우 (초기 상태)
          addMessage('SQL 쿼리가 입력되었습니다. 검증 중...', 'ai', 'validating')
        }
      } else {
        // SQL 쿼리가 없으면 입력 요청 메시지
        addMessage('안녕하세요! SQL 쿼리를 먼저 입력해주세요. CREATE TABLE 구문을 입력하시면 온톨로지 기반 분석을 시작할 수 있습니다.', 'ai')
      }
    }, { immediate: true })

    onMounted(() => {

    })

    return {
      currentMessage,
      messages,
      isLoading,
      messagesContainer,
      messageInput,
      currentNodeState,
      currentStreamingMessage,
      sendMessage,
      handleKeydown,
      formatTime,
      startAnalysis
    }
  }
}
</script>

<style scoped>
.chat-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

h2 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin: 0;
  padding: 16px 20px;
  font-size: 18px;
  font-weight: 600;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 300px;
}

.message {
  margin-bottom: 16px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.ai {
  justify-content: flex-start;
}

.message-content {
  max-width: 80%;
  display: flex;
  flex-direction: column;
}

.message-text {
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message.user .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-left: auto;
}

.message.ai .message-text {
  background: #f1f3f4;
  color: #2d3748;
  border: 1px solid #e2e8f0;
}

.message-time {
  font-size: 11px;
  color: #718096;
  margin-top: 4px;
  text-align: right;
}

.message.ai .message-time {
  text-align: left;
}

.typing-indicator {
  padding: 12px 16px;
  background: #f1f3f4;
  border-radius: 18px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #718096;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}





.node-state-indicator {
  margin-top: 12px;
  text-align: center;
}

.node-state-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 3px 8px rgba(79, 70, 229, 0.3);
  animation: pulse 2s infinite;
  min-width: 120px;
  justify-content: center;
}



.node-state-text {
  white-space: nowrap;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}



.message-text.streaming {
  background: #f1f3f4;
  color: #2d3748;
  border: 1px solid #e2e8f0;
  position: relative;
}

.cursor-blink {
  animation: blink 1s infinite;
  color: #4f46e5;
  font-weight: bold;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

.analysis-button-container {
  margin: 10px 0;
}

.analysis-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.analysis-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.analysis-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
}

.input-container {
  border-top: 1px solid #e2e8f0;
  padding: 16px 20px;
  background: #fafafa;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  resize: none;
  min-height: 20px;
  max-height: 120px;
  font-family: inherit;
  line-height: 1.4;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.send-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 스크롤바 커스터마이징 */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>