import { response } from '../utils/response.js'

export default class CategoryService {
  constructor({ categoryRepository }) {
    this.categoryRepository = categoryRepository
  }

  index = async () => {
    const categories = await this.categoryRepository.getAllSimple()

    return response(200, categories)
  }

  getAll = async ({ page, limit, filters, sortField, sortOrder }, companyId) => {
    return await this.categoryRepository.getAll({ page, limit, filters, sortField, sortOrder }, companyId)
  }
}
