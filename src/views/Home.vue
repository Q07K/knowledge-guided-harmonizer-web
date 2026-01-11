<template>
  <div class="container">
    <h1>
      <img src="@/assets/logo.svg" alt="Logo" class="logo" />
      <span class="text-gradient">Knowledge-Guided Harmonizer</span>
    </h1>
    
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
      streamInitMessage,
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
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

h1 {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.logo {
  height: 40px;
  filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.5));
}

.main-content {
  display: flex;
  gap: 20px;
  height: calc(100vh - 100px);
}

.left-panel {
  width: 450px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-shrink: 0;
}

.right-panel {
  flex: 1;
  min-width: 0; /* Flexbox overflow fix */
  display: flex;
  flex-direction: column;
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
    height: auto;
  }
  
  .left-panel {
    width: 100%;
    height: 600px;
  }
  
  .right-panel {
    height: 600px;
  }
}
</style>