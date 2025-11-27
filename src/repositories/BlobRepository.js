import { put } from '@vercel/blob'

export class BlobRepository {
  async upload (file, folder, fileName) {
    // Getting file type from base64
    const extension = file.split(';')[0].split('/')[1]
    const base64Data = file.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')
    const { url } = await put(`${folder}/${fileName}.${extension}`, buffer, { access: 'public' })

    return url
  }
}
