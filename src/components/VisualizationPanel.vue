<template>
  <h2>시각화 패널</h2>
  <div class="visualization-panel">
    <div id="visualization" ref="visualizationContainer"></div>
    <div class="tooltip" id="tooltip"></div>
    <div class="legend">
      <div class="legend-item">
        <div class="legend-color" style="background: #667eea;"></div>
        <span>엔티티 타입</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'

export default {
  name: 'VisualizationPanel',
  props: {
    data: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const visualizationContainer = ref(null)
    let simulation = null
    
    const createVisualization = (data) => {
      if (!data) return
      
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
        .force('link', d3.forceLink(links).id(d => d.id).distance(200))
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
      if (props.data) {
        createVisualization(props.data)
      }
    }

    // 데이터 변경 감지
    watch(() => props.data, (newData) => {
      if (newData) {
        createVisualization(newData)
      }
    }, { deep: true })

    onMounted(() => {
      window.addEventListener('resize', handleResize)
    })

    return {
      visualizationContainer
    }
  }
}
</script>

<style scoped>
.visualization-panel {
  flex: 1;
  position: relative;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
  height: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

#visualization {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: grab;
}

#visualization:active {
  cursor: grabbing;
}

.tooltip {
  position: absolute;
  background: rgba(45, 55, 72, 0.95);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  max-width: 250px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.legend {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

/* D3.js 스타일 */
:deep(.node) {
  fill: #667eea;
  stroke: #4c51bf;
  stroke-width: 2;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

:deep(.node:hover) {
  fill: #5a67d8;
  r: 28;
}

:deep(.node.pinned) {
  fill: #ed8936;
  stroke: #c05621;
}

:deep(.node-label) {
  fill: white;
  font-size: 10px;
  font-weight: 600;
  text-anchor: middle;
  dominant-baseline: central;
  pointer-events: none;
}

:deep(.node-group.fade) {
  opacity: 0.3;
}

:deep(.link) {
  opacity: 0.6;
  transition: all 0.2s ease-in-out;
}

:deep(.link.fade) {
  opacity: 0.1;
}

:deep(.link.highlight) {
  stroke: #667eea;
  stroke-width: 3;
  opacity: 1;
}

:deep(.relation-label) {
  font-size: 10px;
  font-weight: 600;
  fill: #4a5568;
  text-anchor: middle;
  dominant-baseline: central;
  pointer-events: none;
}

:deep(.relation-label-bg) {
  fill: white;
  stroke: #e2e8f0;
  stroke-width: 1;
  rx: 4;
}

:deep(.relation-label-group.fade) {
  opacity: 0.2;
}
</style>