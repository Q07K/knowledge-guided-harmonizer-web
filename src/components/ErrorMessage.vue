<template>
  <div v-if="message" class="error-message" id="errorMessage">
    {{ message }}
  </div>
</template>

<script>
export default {
  name: 'ErrorMessage',
  props: {
    message: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.error-message {
  background-color: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid rgba(239, 68, 68, 0.5);
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.error-message::before {
  content: '⚠️';
  margin-right: 8px;
}
</style>