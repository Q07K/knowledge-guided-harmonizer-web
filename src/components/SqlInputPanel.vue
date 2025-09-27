<template>
  <div class="panel">

    <h2>SQL Table Create Query 입력</h2>
    <ErrorMessage :message="errorMessage" />
    <textarea 
      id="sqlInput" 
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      placeholder="여기에 SQL CREATE TABLE 쿼리를 입력하세요...&#10;&#10;예시:&#10;CREATE TABLE users (&#10;  id INT PRIMARY KEY,&#10;  name VARCHAR(100),&#10;  email VARCHAR(255)&#10;);"
      :class="validationClass"
    ></textarea>

  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import ErrorMessage from './ErrorMessage.vue'
import { validateSqlCreateTable } from './utils.js'

export default {
  name: 'SqlInputPanel',
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
  emits: ['update:modelValue', 'validation-result'],
  setup(props, { emit }) {
    const validationResult = ref(null)
    const isValidating = ref(false)
    
    // 유효성 검사 함수
    const validateQuery = (query) => {
      if (!query || !query.trim()) {
        return null
      }
      
      const result = validateSqlCreateTable(query)
      return result
    }
    
    // 실시간 유효성 검사
    const performValidation = () => {
      isValidating.value = true
      
      setTimeout(() => {
        const result = validateQuery(props.modelValue)
        validationResult.value = result
        
        // 부모 컴포넌트에 검증 결과 전달
        emit('validation-result', result)
        
        isValidating.value = false
      }, 300) // 300ms 지연으로 타이핑 중 과도한 검증 방지
    }
    
    // 입력값 변경 감지
    watch(() => props.modelValue, () => {
      if (props.modelValue && props.modelValue.trim()) {
        performValidation()
      } else {
        validationResult.value = null
        emit('validation-result', null)
      }
    }, { immediate: true })
    
    // 검증 상태 메시지
    const validationMessage = computed(() => {
      if (isValidating.value) {
        return '검증 중...'
      }
      
      if (!validationResult.value) {
        return ''
      }
      
      if (validationResult.value.isValid) {
        return validationResult.value.message
      } else {
        return validationResult.value.error
      }
    })
    
    // 검증 상태 클래스
    const validationClass = computed(() => {
      if (isValidating.value) {
        return 'validating'
      }
      
      if (!validationResult.value) {
        return ''
      }
      
      return validationResult.value.isValid ? 'valid' : 'invalid'
    })
    
    return {
      validationResult,
      isValidating,
      validationMessage,
      validationClass
    }
  }
}
</script>

<style scoped>
.panel {
  resize: vertical;
}

#sqlInput {
  width: 100%;
  height: 100%;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 0px 0px 12px 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  transition: border-color 0.2s ease-in-out;
  outline: none;
}

#sqlInput:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 검증 상태에 따른 스타일 */
#sqlInput.validating {
  border-color: #fbbf24;
}

#sqlInput.valid {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

#sqlInput.invalid {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
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