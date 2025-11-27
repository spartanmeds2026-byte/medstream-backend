const FilterMatchMode = {
  STARTS_WITH: 'startsWith',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'notContains',
  ENDS_WITH: 'endsWith',
  EQUALS: 'equals',
  NOT_EQUALS: 'notEquals',
  IN: 'in',
  LESS_THAN: 'lt',
  LESS_THAN_OR_EQUAL_TO: 'lte',
  GREATER_THAN: 'gt',
  GREATER_THAN_OR_EQUAL_TO: 'gte',
  BETWEEN: 'between',
  DATE_IS: 'dateIs',
  DATE_IS_NOT: 'dateIsNot',
  DATE_BEFORE: 'dateBefore',
  DATE_AFTER: 'dateAfter'
}

const FilterOperator = {
  AND: 'AND',
  OR: 'OR'
}

function createFilter(field, condition) {
  if (field.includes('data.')) {
    const newField = field.replace('data.', '')
    return {
      [newField]: condition
    }
  } else {
    return {
      [field]: condition
    }
  }
}

function toLowerCase(value) {
  if (typeof value === 'string') {
    return value.toLowerCase()
  }
  return value
}

export function applyFilters(query, filters) {
  if (!filters) return query

  const where = {}

  for (const [field, condition] of Object.entries(filters)) {
    if (field === 'global') continue

    const { operator = FilterOperator.AND, constraints = [] } = condition
    const conditions = constraints.map(constraint => {
      const { value, matchMode } = constraint
      if (value === undefined || value === null) return null

      let filterCondition

      switch (matchMode) {
        case FilterMatchMode.STARTS_WITH:
          filterCondition = { startsWith: toLowerCase(value), mode: 'insensitive' }
          break
        case FilterMatchMode.CONTAINS:
          filterCondition = { contains: toLowerCase(value), mode: 'insensitive' }
          break
        case FilterMatchMode.NOT_CONTAINS:
          filterCondition = { not: { contains: value }, mode: 'insensitive' }
          break
        case FilterMatchMode.ENDS_WITH:
          filterCondition = { endsWith: toLowerCase(value), mode: 'insensitive' }
          break
        case FilterMatchMode.EQUALS:
          filterCondition = { equals: toLowerCase(value), mode: 'insensitive' }
          break
        case FilterMatchMode.NOT_EQUALS:
          filterCondition = { not: { contains: value }, mode: 'insensitive' }
          break
        case FilterMatchMode.IN:
          filterCondition = { in: value && Array.isArray(value) ? value.map(toLowerCase) : [] }
          break
        case FilterMatchMode.LESS_THAN:
          filterCondition = { lt: value }
          break
        case FilterMatchMode.LESS_THAN_OR_EQUAL_TO:
          filterCondition = { lte: value }
          break
        case FilterMatchMode.GREATER_THAN:
          filterCondition = { gt: value }
          break
        case FilterMatchMode.GREATER_THAN_OR_EQUAL_TO:
          filterCondition = { gte: value }
          break
        case FilterMatchMode.BETWEEN:
          filterCondition = { gte: value?.[0], lte: value?.[1] }
          break
        case FilterMatchMode.DATE_IS:
          filterCondition = { equals: value }
          break
        case FilterMatchMode.DATE_IS_NOT:
          filterCondition = { not: { equals: value } }
          break
        case FilterMatchMode.DATE_BEFORE:
          filterCondition = { lt: value }
          break
        case FilterMatchMode.DATE_AFTER:
          filterCondition = { gt: value }
          break
        default:
          filterCondition = {}
      }

      return createFilter(field, filterCondition)
    }).filter(Boolean)

    if (!where[operator.toUpperCase()]) {
      where[operator.toUpperCase()] = []
    }

    where[operator.toUpperCase()].push(...conditions)
  }

  query.where = where
  return query
}
