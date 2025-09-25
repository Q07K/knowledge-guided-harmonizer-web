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
  background-color: #fed7d7;
  color: #9b2c2c;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #feb2b2;
  font-size: 14px;
  font-weight: 500;
}
</style>