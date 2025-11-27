import { Model } from '../utils/model.js'

export class UserModel extends Model {
  table = 'users'
  selectable = [
    'id',
    'first_name',
    'last_name',
    'email',
    'picture',
    'role'
  ]

  strictSelect = true
}
