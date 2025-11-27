import { Upload } from '@aws-sdk/lib-storage'
import { S3Client, S3 } from '@aws-sdk/client-s3'
import { Buffer } from 'buffer'

export class S3Repository {
  constructor () {
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    this.region = process.env.S3_REGION
    this.Bucket = process.env.S3_BUCKET
  }

  async upload (file, folder, fileName) {
    const client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey
      }
    })
    // Getting file type from base64
    const fileType = `image/${file.split(';')[0].split('/')[1]}`
    const extension = file.split(';')[0].split('/')[1]
    const base64Data = file.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')
    // Upload using base64

    const upload = new Upload({
      client,
      params: {
        ACL: 'public-read',
        Bucket: this.Bucket,
        Key: `${folder}/${fileName}.${extension}`,
        Body: buffer,
        ContentType: fileType
      }
    })
    const response = await upload.done()

    const url = `https://${this.Bucket}.s3.${this.region}.amazonaws.com/${folder}/${fileName}.${extension}`
    return url
  }
}
