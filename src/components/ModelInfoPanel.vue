<template>
  <div v-if="show" class="info-panel" id="infoPanel">
    <h3>메타모델 정보</h3>
    <div id="modelInfo">
      <div class="info-item"><strong>이름:</strong> <span>{{ modelInfo.name }}</span></div>
      <div class="info-item"><strong>도메인:</strong> <span>{{ modelInfo.domain }}</span></div>
      <div class="info-item"><strong>엔티티 수:</strong> <span>{{ modelInfo.entityCount }}개</span></div>
      <div class="info-item"><strong>관계 수:</strong> <span>{{ modelInfo.relationCount }}개</span></div>
      <div class="info-item"><strong>완성도:</strong> <span>{{ modelInfo.completeness }}%</span></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModelInfoPanel',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    modelInfo: {
      type: Object,
      default: () => ({
        name: '',
        domain: '',
        entityCount: 0,
        relationCount: 0,
        completeness: 0
      })
    }
  }
}
</script>

<style scoped>
.info-panel {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-panel h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #2d3748;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f7fafc;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item strong {
  color: #4a5568;
  font-weight: 600;
}

.info-item span {
  color: #2d3748;
  font-weight: 500;
}
</style>