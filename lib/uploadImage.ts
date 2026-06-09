// lib/uploadImage.ts
// Upload image to imgbb and return URL
export async function uploadToImgbb(file: File): Promise<string> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const formData = new FormData()
  formData.append("image", base64)
  formData.append("key", "02b4c7432d64053cdaebd47e3a9918ab")

  const res = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  })

  const data = await res.json()
  if (!data.success) throw new Error("Image upload failed")
  return data.data.url
}