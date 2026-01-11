<template>
  <div class="glass-panel panel">

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

<style lang="scss" scoped>
.panel {
  display: flex;
  flex-direction: column;
  padding: 20px;
  /* height is controlled by parent or content */
}

h2 {
  font-size: 1.1rem;
  margin-bottom: 16px;
  color: var(--text-secondary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '';
    display: block;
    width: 4px;
    height: 16px;
    background: var(--accent-primary);
    border-radius: 2px;
  }
}

textarea#sqlInput {
  width: 100%;
  height: 250px; /* Fixed height for consistency */
  padding: 16px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: 'JetBrains Mono', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.2s ease;
  
  &::placeholder {
    color: var(--text-tertiary);
  }

  &:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px var(--accent-glow);
    background: rgba(15, 23, 42, 0.8);
  }

  &.validating {
    border-color: var(--warning);
  }

  &.valid {
    border-color: var(--success);
    box-shadow: 0 0 0 1px var(--success);
  }

  &.invalid {
    border-color: var(--error);
    box-shadow: 0 0 0 1px var(--error);
  }
}
</style>