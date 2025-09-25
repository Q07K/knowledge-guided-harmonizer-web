<template>
  <div class="container">
    <h1>온톨로지 메타모델 시각화</h1>
    
    <div class="main-content">
      <div class="input-panel">
        <JsonInputPanel 
          v-model="jsonInput"
          :error-message="errorMessage"
          @visualize="visualizeData"
          @load-sample="loadSampleData"
          @clear="clearData"
        />
        
        <ModelInfoPanel 
          :show="showInfoPanel"
          :model-info="modelInfo"
        />
      </div>
      
      <VisualizationPanel :data="currentData" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import JsonInputPanel from '../components/JsonInputPanel.vue'
import ModelInfoPanel from '../components/ModelInfoPanel.vue'
import VisualizationPanel from '../components/VisualizationPanel.vue'
import { getSampleData, calculateModelInfo } from '../components/utils.js'

export default {
  name: 'Home',
  components: {
    JsonInputPanel,
    ModelInfoPanel,
    VisualizationPanel
  },
  setup() {
    const jsonInput = ref('')
    const errorMessage = ref('')
    const showInfoPanel = ref(false)
    const modelInfo = ref({
      name: '',
      domain: '',
      entityCount: 0,
      relationCount: 0,
      completeness: 0
    })
    const currentData = ref(null)

    const showError = (message) => {
      errorMessage.value = message
    }

    const hideError = () => {
      errorMessage.value = ''
    }

    const updateInfo = (data) => {
      modelInfo.value = calculateModelInfo(data)
      showInfoPanel.value = true
    }

    const loadSampleData = () => {
      const sampleData = getSampleData()
      jsonInput.value = JSON.stringify(sampleData, null, 2)
      visualizeData()
    }

    const clearData = () => {
      jsonInput.value = ''
      hideError()
      showInfoPanel.value = false
      currentData.value = null
    }

    const visualizeData = () => {
      hideError()
      
      const input = jsonInput.value.trim()
      if (!input) {
        showError('JSON 데이터를 입력해주세요.')
        return
      }

      try {
        const parsedData = JSON.parse(input)
        currentData.value = parsedData
        updateInfo(parsedData)
      } catch (error) {
        showError('유효하지 않은 JSON 형식입니다: ' + error.message)
      }
    }

    onMounted(() => {
      loadSampleData() // 초기 로드 시 샘플 데이터 표시
    })

    return {
      jsonInput,
      errorMessage,
      showInfoPanel,
      modelInfo,
      currentData,
      loadSampleData,
      clearData,
      visualizeData
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

.input-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
    height: auto;
  }
  
  .input-panel {
    width: 100%;
  }
}
</style>