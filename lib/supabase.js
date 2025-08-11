import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// File upload helper
export async function uploadFile(file, bucketName = 'uploads', folder = '') {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file)

    if (error) {
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return {
      success: true,
      path: filePath,
      url: urlData.publicUrl,
      filename: fileName,
      originalName: file.name,
      size: file.size,
      mimetype: file.type
    }
  } catch (error) {
    console.error('File upload error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Delete file helper
export async function deleteFile(filePath, bucketName = 'uploads') {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('File delete error:', error)
    return { success: false, error: error.message }
  }
}