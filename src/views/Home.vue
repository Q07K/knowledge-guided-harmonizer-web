<template>
  <div class="container">
    <h1>온톨로지 메타모델 시각화</h1>
    
    <div class="main-content">
      <div class="input-panel">
        <div class="input-section">
          <h2>JSON 데이터 입력</h2>
          <div v-if="errorMessage" class="error-message" id="errorMessage">
            {{ errorMessage }}
          </div>
          
          <div class="textarea-container">
            <textarea 
              id="jsonInput" 
              v-model="jsonInput"
              placeholder="여기에 온톨로지 메타모델 JSON을 입력하세요..."
            ></textarea>
          </div>
          
          <div class="button-group">
            <button class="btn" @click="visualizeData">시각화</button>
            <button class="btn btn-secondary" @click="loadSampleData">샘플 데이터</button>
            <button class="btn btn-secondary" @click="clearData">초기화</button>
          </div>
        </div>
        
        <div v-if="showInfoPanel" class="info-panel" id="infoPanel">
          <h3>메타모델 정보</h3>
          <div id="modelInfo">
            <div class="info-item"><strong>이름:</strong> <span>{{ modelInfo.name }}</span></div>
            <div class="info-item"><strong>도메인:</strong> <span>{{ modelInfo.domain }}</span></div>
            <div class="info-item"><strong>엔티티 수:</strong> <span>{{ modelInfo.entityCount }}개</span></div>
            <div class="info-item"><strong>관계 수:</strong> <span>{{ modelInfo.relationCount }}개</span></div>
            <div class="info-item"><strong>완성도:</strong> <span>{{ modelInfo.completeness }}%</span></div>
          </div>
        </div>
      </div>
      
      <div class="visualization-panel">
        <div id="visualization"></div>
        <div class="tooltip" id="tooltip"></div>
        <div class="legend">
          <div class="legend-item">
            <div class="legend-color" style="background: #667eea;"></div>
            <span>엔티티 타입</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import * as d3 from 'd3'

export default {
  name: 'Home',
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
    
    let currentData = null
    let simulation = null
    
    const getSampleData = () => {
      return {
        "name": "E-commerce Platform Ontology",
        "description": "이 온톨로지는 사용자 관리, 상품 카탈로그, 주문 처리, 결제 및 배송, 고객 상호작용(리뷰, 위시리스트)을 포함하는 전자상거래 플랫폼의 핵심 엔티티와 관계를 설명합니다.",
        "domain": "E-commerce / Online Retail",
        "entity_types": [
          {
            "name": "User",
            "display_name": "사용자",
            "description": "플랫폼을 이용하는 고객 또는 관리자",
            "properties": [
              {"name": "user_id", "type": "integer", "description": "사용자 고유 식별자", "required": true},
              {"name": "email", "type": "string", "description": "사용자 이메일 주소 (고유)", "required": true},
              {"name": "password_hash", "type": "string", "description": "사용자 비밀번호 해시", "required": true},
              {"name": "first_name", "type": "string", "description": "사용자 이름", "required": true},
              {"name": "last_name", "type": "string", "description": "사용자 성", "required": true}
            ]
          },
          {
            "name": "Product",
            "display_name": "상품",
            "description": "판매되는 개별 상품",
            "properties": [
              {"name": "product_id", "type": "integer", "description": "상품 고유 식별자", "required": true},
              {"name": "product_name", "type": "string", "description": "상품 이름", "required": true},
              {"name": "price", "type": "float", "description": "상품 판매 가격", "required": true}
            ]
          }
        ],
        "relation_types": [
          {
            "name": "purchases",
            "display_name": "구매함",
            "description": "사용자가 상품을 구매하는 관계",
            "source_entity_types": ["User"],
            "target_entity_types": ["Product"],
            "cardinality": "many-to-many"
          }
        ],
        "completeness_score": 0.9
      }
    }

    const showError = (message) => {
      errorMessage.value = message
    }

    const hideError = () => {
      errorMessage.value = ''
    }

    const updateInfo = (data) => {
      modelInfo.value = {
        name: data.name,
        domain: data.domain,
        entityCount: data.entity_types.length,
        relationCount: data.relation_types.length,
        completeness: Math.round(data.completeness_score * 100)
      }
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
      d3.select('#visualization').selectAll('*').remove()
      currentData = null
    }

    const visualizeData = () => {
      hideError()
      
      const input = jsonInput.value.trim()
      if (!input) {
        showError('JSON 데이터를 입력해주세요.')
        return
      }

      try {
        currentData = JSON.parse(input)
        updateInfo(currentData)
        createVisualization(currentData)
      } catch (error) {
        showError('유효하지 않은 JSON 형식입니다: ' + error.message)
      }
    }

    const createVisualization = (data) => {
      d3.select('#visualization').selectAll('*').remove()

      const container = document.getElementById('visualization')
      const width = container.clientWidth
      const height = container.clientHeight

      const svg = d3.select('#visualization')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height])
      
      // 줌 기능 추가
      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", zoomed)
      
      const g = svg.append("g")
      svg.call(zoom)

      function zoomed(event) {
        g.attr("transform", event.transform)
      }

      // 화살표 마커 정의
      svg.append('defs')
        .append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 32)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#a0aec0')
        .style('transition', 'fill 0.2s ease-in-out')

      const nodes = data.entity_types.map(d => ({...d, id: d.name}))
      const links = []

      // 관계를 링크로 변환
      data.relation_types.forEach(relation => {
        relation.source_entity_types.forEach(sourceType => {
          relation.target_entity_types.forEach(targetType => {
            const sourceNode = nodes.find(n => n.name === sourceType)
            const targetNode = nodes.find(n => n.name === targetType)
            if (sourceNode && targetNode) {
              links.push({
                source: sourceNode.id,
                target: targetNode.id,
                relation: relation
              })
            }
          })
        })
      })

      const tooltip = d3.select('#tooltip')

      simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(120))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))

      const link = g.append('g')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('class', 'link')
        .attr('stroke', '#a0aec0')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)')

      const relationLabelGroup = g.append('g')
        .selectAll('.relation-label-group')
        .data(links)
        .enter().append('g')
        .attr('class', 'relation-label-group')

      relationLabelGroup.append('rect')
        .attr('class', 'relation-label-bg')

      relationLabelGroup.append('text')
        .attr('class', 'relation-label')
        .text(d => d.relation.display_name)

      const nodeGroup = g.append('g')
        .selectAll('.node-group')
        .data(nodes)
        .enter().append('g')
        .attr('class', 'node-group')
        .call(drag(simulation))

      // 더블클릭으로 노드 고정/해제
      nodeGroup.on('dblclick', function(event, d) {
        d.fx = d.fx ? null : d.x
        d.fy = d.fy ? null : d.y
        d3.select(this).select('.node').classed('pinned', d.fx !== null)
      })
                
      // 노드 호버 및 하이라이트 기능
      const linkedByIndex = {}
      links.forEach(d => {
        linkedByIndex[`${d.source.id},${d.target.id}`] = 1
      })

      function isConnected(a, b) {
        return linkedByIndex[`${a.id},${b.id}`] || linkedByIndex[`${b.id},${a.id}`] || a.id === b.id
      }

      nodeGroup.on('mouseover', function(event, d) {
        tooltip.style('opacity', 1)

        nodeGroup.classed('fade', o => !isConnected(d, o))
        link.classed('fade', o => o.source.id !== d.id && o.target.id !== d.id)
        link.classed('highlight', o => o.source.id === d.id || o.target.id === d.id)
        relationLabelGroup.classed('fade', o => o.source.id !== d.id && o.target.id !== d.id)
      })

      nodeGroup.on('mouseout', function() {
        tooltip.style('opacity', 0)
        nodeGroup.classed('fade', false)
        link.classed('fade', false).classed('highlight', false)
        relationLabelGroup.classed('fade', false)
      })
      
      nodeGroup.on('mousemove', function(event, d) {
        const propertiesHtml = d.properties ? 
          d.properties.map(p => `<div><strong>${p.name}</strong> (${p.type})</div>`).join('') 
          : ''

        tooltip.html(`
          <strong>${d.display_name}</strong>
          <hr style="border-color: #4a5568; margin: 4px 0;">
          <p style="margin-bottom: 8px;">${d.description}</p>
          ${propertiesHtml}
        `)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY + 15) + 'px')
      })

      nodeGroup.append('circle')
        .attr('class', 'node entity-node')
        .attr('r', 25)
      
      nodeGroup.append('text')
        .attr('class', 'node-label')
        .text(d => d.display_name.length > 7 ? d.display_name.substring(0,6) + '...' : d.display_name)

      simulation.on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y)

        nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`)

        relationLabelGroup.attr('transform', d => `translate(${(d.source.x + d.target.x) / 2}, ${(d.source.y + d.target.y) / 2})`)
        
        relationLabelGroup.select('.relation-label-bg')
          .each(function(d) {
            const textNode = d3.select(this.parentNode).select('text').node()
            if (textNode) {
              const textBBox = textNode.getBBox()
              d3.select(this)
                .attr('x', textBBox.x - 4)
                .attr('y', textBBox.y - 2)
                .attr('width', textBBox.width + 8)
                .attr('height', textBBox.height + 4)
            }
          })
      })
    }
    
    // 드래그 핸들러
    const drag = (simulation) => {
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      }

      function dragged(event, d) {
        d.fx = event.x
        d.fy = event.y
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0)
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    }

    // 창 크기 변경 시 재시각화
    const handleResize = () => {
      if (currentData) {
        createVisualization(currentData)
      }
    }

    onMounted(() => {
      window.addEventListener('resize', handleResize)
      loadSampleData() // 초기 로드 시 샘플 데이터 표시
    })

    return {
      jsonInput,
      errorMessage,
      showInfoPanel,
      modelInfo,
      loadSampleData,
      clearData,
      visualizeData
    }
  }
}
</script>

