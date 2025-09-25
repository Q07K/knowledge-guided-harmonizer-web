// 샘플 데이터 및 유틸리티 함수들
export const getSampleData = () => {
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

export const calculateModelInfo = (data) => {
  return {
    name: data.name,
    domain: data.domain,
    entityCount: data.entity_types.length,
    relationCount: data.relation_types.length,
    completeness: Math.round(data.completeness_score * 100)
  }
}