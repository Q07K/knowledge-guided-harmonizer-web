<template>
  <div class="input-section">
    <h2>JSON 데이터 입력</h2>
    <ErrorMessage :message="errorMessage" />
    
    <div class="textarea-container">
      <textarea 
        id="jsonInput" 
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        placeholder="여기에 온톨로지 메타모델 JSON을 입력하세요..."
      ></textarea>
    </div>
    
    <div class="button-group">
      <button class="btn" @click="$emit('visualize')">시각화</button>
      <button class="btn btn-secondary" @click="$emit('load-sample')">샘플 데이터</button>
      <button class="btn btn-secondary" @click="$emit('clear')">초기화</button>
    </div>
  </div>
</template>

<script>
import ErrorMessage from './ErrorMessage.vue'

export default {
  name: 'JsonInputPanel',
  components: {
    ErrorMessage
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    errorMessage: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'visualize', 'load-sample', 'clear']
}
</script>

<style scoped>
.input-section {
  margin-bottom: 24px;
}

.input-section h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #2d3748;
}

.textarea-container {
  margin-bottom: 16px;
}

#jsonInput {
  width: 100%;
  height: 300px;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s ease-in-out;
  outline: none;
}

#jsonInput:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
}

.btn-secondary:hover {
  box-shadow: 0 4px 12px rgba(113, 128, 150, 0.3);
}
</style>