<template>
  <div class="container">
    <h1>Knowledge-Guided Harmonizer</h1>
    
    <div class="main-content">
      <div class="left-panel">
        <SqlInputPanel 
          v-model="sqlInput" 
          :error-message="errorMessage"
          @validation-result="handleValidationResult"
        />        <ChatPanel 
          :sql-query="sqlInput"
          :sql-validation="sqlValidation"
          @start-analysis="handleStartAnalysis"
          @visualization-data="handleVisualizationData"
        />
      </div>
      
      <div class="right-panel">
        <VisualizationPanel 
          :data="visualizationData"
          :title="'온톨로지 지식 그래프'"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import SqlInputPanel from '../components/SqlInputPanel.vue'
import ChatPanel from '../components/ChatPanel.vue'
import VisualizationPanel from '../components/VisualizationPanel.vue'
import { useHarmonizerApi } from '../composables/useHarmonizerApi.js'

export default {
  name: 'Home',
  components: {
    SqlInputPanel,
    ChatPanel,
    VisualizationPanel
  },
  setup() {
    const sqlInput = ref('')
    const errorMessage = ref('')
    const visualizationData = ref(null)
    const sqlValidation = ref(null)

    // Harmonizer API Composable 사용
    const { 
      loading, 
      error: apiError, 
      streamChat,
      clearError: clearApiError
    } = useHarmonizerApi()

    const handleStartAnalysis = async (sqlQuery) => {
      console.log('분석 시작:', sqlQuery)
      // 분석 시작 로직은 ChatPanel에서 처리됩니다
    }

    const handleVisualizationData = (data) => {
      console.log('시각화 데이터 업데이트:', data)
      visualizationData.value = data
    }

    const handleValidationResult = (result) => {
      console.log('SQL 검증 결과:', result)
      sqlValidation.value = result
      
      // 채팅 컴포넌트에서 오류를 표시하므로 여기서는 errorMessage를 설정하지 않음
      // 다른 종류의 에러만 errorMessage에 설정
      if (!result || result.isValid) {
        errorMessage.value = ''
      }
    }

    return {
      sqlInput,
      errorMessage,
      loading,
      visualizationData,
      sqlValidation,
      handleStartAnalysis,
      handleVisualizationData,
      handleValidationResult
    }
  }
}
</script>

<style scoped>
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

h1 {
  text-align: center;
  color: #2d3748;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 32px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.main-content {
  display: flex;
  gap: 24px;
  height: calc(100vh - 140px);
}

.left-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.right-panel {
  flex: 1;
  min-width: 600px;
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
    height: auto;
  }
  
  .left-panel {
    width: 100%;
  }
  
  .right-panel {
    min-width: auto;
    min-height: 400px;
  }
}
</style>