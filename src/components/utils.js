// 샘플 데이터 및 유틸리티 함수들

// SQL CREATE TABLE 쿼리 유효성 검사
export const validateSqlCreateTable = (sqlQuery) => {
  if (!sqlQuery || typeof sqlQuery !== 'string') {
    return {
      isValid: false,
      error: 'SQL 쿼리가 비어있습니다.'
    }
  }

  const trimmedQuery = sqlQuery.trim()
  
  if (!trimmedQuery) {
    return {
      isValid: false,
      error: 'SQL 쿼리가 비어있습니다.'
    }
  }

  // CREATE TABLE 키워드 확인
  const createTableRegex = /^\s*CREATE\s+TABLE\s+/i
  if (!createTableRegex.test(trimmedQuery)) {
    return {
      isValid: false,
      error: 'CREATE TABLE로 시작하는 SQL 쿼리가 아닙니다.'
    }
  }

  // 테이블 명 추출 및 검사
  const tableNameMatch = trimmedQuery.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`\w]+)\s*\(/i)
  if (!tableNameMatch) {
    return {
      isValid: false,
      error: '테이블 이름을 찾을 수 없습니다.'
    }
  }

  const tableName = tableNameMatch[1].replace(/[`"]/g, '')
  
  // 테이블 이름 유효성 검사
  const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
  if (!tableNameRegex.test(tableName)) {
    return {
      isValid: false,
      error: '테이블 이름이 유효하지 않습니다. 영문자, 숫자, 언더스코어만 사용 가능합니다.'
    }
  }

  // 괄호 균형 검사
  const openParen = (trimmedQuery.match(/\(/g) || []).length
  const closeParen = (trimmedQuery.match(/\)/g) || []).length
  if (openParen !== closeParen) {
    return {
      isValid: false,
      error: '괄호가 올바르게 닫히지 않았습니다.'
    }
  }

  // 컬럼 정의 추출
  const columnMatch = trimmedQuery.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`\w]+\s*\(([\s\S]*)\)\s*;?\s*$/i)
  if (!columnMatch) {
    return {
      isValid: false,
      error: '컬럼 정의를 찾을 수 없습니다.'
    }
  }

  const columnsSection = columnMatch[1].trim()
  if (!columnsSection) {
    return {
      isValid: false,
      error: '컬럼 정의가 비어있습니다.'
    }
  }

  // 기본적인 컬럼 정의 검사
  const columns = parseColumns(columnsSection)
  if (columns.error) {
    return {
      isValid: false,
      error: columns.error
    }
  }

  if (columns.data.length === 0) {
    return {
      isValid: false,
      error: '최소 하나의 컬럼이 필요합니다.'
    }
  }

  // 컬럼 이름 중복 검사
  const columnNames = columns.data.map(col => col.name.toLowerCase())
  const duplicates = columnNames.filter((name, index) => columnNames.indexOf(name) !== index)
  if (duplicates.length > 0) {
    return {
      isValid: false,
      error: `중복된 컬럼 이름이 있습니다: ${duplicates.join(', ')}`
    }
  }

  return {
    isValid: true,
    tableName,
    columns: columns.data,
    message: `유효한 CREATE TABLE 문입니다. 테이블: ${tableName}, 컬럼 수: ${columns.data.length}`
  }
}

// 컬럼 파싱 함수
const parseColumns = (columnsSection) => {
  try {
    const columns = []
    const lines = columnsSection.split(',')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // 제약조건 키워드들 (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, INDEX 등)
      const constraintKeywords = [
        'PRIMARY\\s+KEY', 'FOREIGN\\s+KEY', 'UNIQUE\\s+KEY', 'KEY', 'INDEX',
        'CONSTRAINT', 'CHECK', 'UNIQUE(?!\\s+KEY)'
      ]
      
      const isConstraint = constraintKeywords.some(keyword => 
        new RegExp(`^\\s*${keyword}`, 'i').test(line)
      )
      
      if (isConstraint) {
        // 제약조건은 건너뛰기
        continue
      }
      
      // 컬럼 이름 추출
      const columnMatch = line.match(/^\s*([`"]?[a-zA-Z_][a-zA-Z0-9_]*[`"]?)\s+(.+)/i)
      if (!columnMatch) {
        return {
          error: `컬럼 정의가 잘못되었습니다: ${line}`
        }
      }
      
      const columnName = columnMatch[1].replace(/[`"]/g, '')
      const columnDefinition = columnMatch[2].trim()
      
      // 컬럼 이름 유효성 검사
      const columnNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
      if (!columnNameRegex.test(columnName)) {
        return {
          error: `컬럼 이름이 유효하지 않습니다: ${columnName}`
        }
      }
      
      // 데이터 타입 추출
      const typeMatch = columnDefinition.match(/^([a-zA-Z]+)(\([^)]+\))?/i)
      if (!typeMatch) {
        return {
          error: `데이터 타입을 찾을 수 없습니다: ${columnName}`
        }
      }
      
      const dataType = typeMatch[1].toUpperCase()
      const typeParams = typeMatch[2] || ''
      
      // 일반적인 MySQL 데이터 타입 검사
      const validTypes = [
        'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'MEDIUMINT',
        'VARCHAR', 'CHAR', 'TEXT', 'LONGTEXT', 'MEDIUMTEXT', 'TINYTEXT',
        'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL',
        'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'YEAR',
        'BOOLEAN', 'BOOL', 'BIT',
        'BLOB', 'LONGBLOB', 'MEDIUMBLOB', 'TINYBLOB',
        'JSON', 'ENUM', 'SET'
      ]
      
      if (!validTypes.includes(dataType)) {
        return {
          error: `지원하지 않는 데이터 타입입니다: ${dataType}`
        }
      }
      
      columns.push({
        name: columnName,
        type: dataType + typeParams,
        definition: columnDefinition,
        isPrimary: /PRIMARY\s+KEY/i.test(columnDefinition),
        isNotNull: /NOT\s+NULL/i.test(columnDefinition),
        isUnique: /UNIQUE/i.test(columnDefinition),
        hasDefault: /DEFAULT/i.test(columnDefinition)
      })
    }
    
    return { data: columns }
  } catch (error) {
    return {
      error: `컬럼 파싱 중 오류 발생: ${error.message}`
    }
  }
}

export const getSampleSqlQuery = () => {
  return `CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  parent_id INT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);`
}

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