import prisma from '../utils/prisma.js'
export default async function getRelations(data, referenceField, tableName = null) {
  let isArray = true
  if (!Array.isArray(data)) {
    data = [data]
    isArray = false
  }

  let table = referenceField + 's'
  if (referenceField[referenceField.length - 1] === 'y') {
    table = referenceField.slice(0, -1) + 'ies'
  }
  let referenceFieldId = referenceField + '_id'
  let referenceFieldDataId = referenceField
  if (referenceField === 'updated' || referenceField === 'created') {
    referenceFieldId = referenceField + '_by'
    referenceFieldDataId = referenceField + '_by'
  }

  let relationIds = data.map((item) => {
    if (item?.data === undefined) {
      return item[referenceFieldId] ?? undefined
    } else {
      return item[referenceFieldId] === undefined ? item.data[referenceFieldDataId] : item[referenceFieldId]
    }
  })

  relationIds = relationIds.filter((item) => item !== undefined)
  relationIds = relationIds.filter((item) => item !== null)

  // Verifying if relation is one to many
  if (relationIds.length > 0) {
    // one to many
    const relations = await prisma[table].findMany({
      where: { id: { in: relationIds } }
    })
    const relationsMapped = []

    for (let i = 0; i < relations.length; i += 1) {
      relationsMapped[relations[i].id] = relations[i]
    }

    const result = data.map((item) => {
      const referenceData = item[referenceFieldId] === undefined ? item.data[referenceFieldDataId] : item[referenceFieldId]

      if (!referenceData) return item

      return {
        ...item,
        [referenceFieldDataId]: relationsMapped[referenceData]
      }
    })

    if (isArray) return result

    return result[0]
  } else {
    // many to one
    const result = await Promise.all(
      data.map(async (item) => {
        const foreignResults = await prisma[table].findMany({
          where: {
            [tableName + '_id']: item.id
          }
        })

        return {
          ...item,
          [referenceField]: foreignResults
        }
      })
    )

    if (isArray) return result

    return result[0]
  }
}
