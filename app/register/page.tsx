"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, ChevronDown, AlertTriangle, Eye, EyeOff, Info, Building2, User, Upload, X, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const steps = [
  { id: 1, name: "Seller account creation" },
  { id: 2, name: "Shop information" },
  { id: 3, name: "Verify tax details" },
  { id: 4, name: "Bank details" },
]

const productCategories = [
  { id: "accessories", label: "Accessories" },
  { id: "engine", label: "Engine Parts" },
  { id: "brakes", label: "Brakes & Suspension" },
  { id: "electrical", label: "Electrical & Lighting" },
  { id: "body", label: "Body Parts" },
  { id: "interior", label: "Interior & Comfort" },
  { id: "wheels", label: "Wheels & Tyres" },
  { id: "all", label: "All Categories" },
  { id: "other", label: "Other" },
]

export default function SellerRegistration() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showGstWarning, setShowGstWarning] = useState(false)
  const [showPartsTypeWarning, setShowPartsTypeWarning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ shopEmail?: string; shopUsername?: string }>({})
  const [shopUsernameStatus, setShopUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")

  const [formData, setFormData] = useState({
    // Account details (owner info)
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    idDocumentType: "",
    idDocumentNumber: "",
    idDocumentFile: null as File | null,
    idDocumentPreview: "",
    // Shop info
    shopUsername: "",
    shopName: "",
    shopEmail: "",
    shopPhone: "",
    shopPassword: "",
    shopConfirmPassword: "",
    hasPhysicalStore: "",
    selectedCategories: [] as string[],
    otherCategory: "",
    productCondition: "",
    partsTypeConfirmed: false,
    // Tax details
    hasGst: "",
    gstNumber: "",
    taxIndependent: false,
    // Bank details
    payToName: "",
    ifscCode: "",
    accountNumber: "",
    accountType: "individual",
    bankFirstName: "",
    bankLastName: "",
    bankAddress: "",
    bankCity: "",
    bankPostalCode: "",
    bankCountry: "India",
    bankPhone: "",
    dobDay: "",
    dobMonth: "",
    dobYear: "",
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleInputChange = (field: string, value: string | boolean | string[] | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (validationErrors.length > 0) setValidationErrors([])
  }

  const idDocInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image (JPG, PNG) or PDF file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      
      setFormData(prev => ({
        ...prev,
        idDocumentFile: file,
        idDocumentPreview: file.type === 'application/pdf' ? 'pdf' : ''
      }))
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, idDocumentPreview: reader.result as string }))
        }
        reader.readAsDataURL(file)
      }
    }
    if (idDocInputRef.current) idDocInputRef.current.value = ""
  }

  const removeUploadedFile = () => {
    setFormData(prev => ({ ...prev, idDocumentFile: null, idDocumentPreview: "" }))
  }

  // Show popup when parts type is selected
  useEffect(() => {
    if (formData.productCondition && !formData.partsTypeConfirmed) {
      setShowPartsTypeWarning(true)
    }
  }, [formData.productCondition, formData.partsTypeConfirmed])

  // Debounced shop username availability check — checks against all users (buyers + sellers)
  useEffect(() => {
    const u = formData.shopUsername
    if (!u || u.length < 3) { setShopUsernameStatus("idle"); return }
    if (!/^[a-z0-9._]+$/.test(u)) { setShopUsernameStatus("idle"); return }
    setShopUsernameStatus("checking")
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-username?username=${encodeURIComponent(u)}`)
        const data = await res.json()
        setShopUsernameStatus(data.available ? "available" : "taken")
      } catch { setShopUsernameStatus("idle") }
    }, 500)
    return () => clearTimeout(timer)
  }, [formData.shopUsername])

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => {
      const current = prev.selectedCategories
      if (current.includes(categoryId)) {
        return { ...prev, selectedCategories: current.filter((c) => c !== categoryId) }
      } else {
        return { ...prev, selectedCategories: [...current, categoryId] }
      }
    })
  }

  const validateStep = (step: number): string[] => {
    const errors: string[] = []
    if (step === 1) {
      if (!formData.firstName.trim()) errors.push("First Name is required")
      if (!formData.lastName.trim()) errors.push("Last Name is required")
      if (!formData.email.trim()) errors.push("Email is required")
      else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.push("Enter a valid email")
      if (!formData.phone.trim()) errors.push("Phone Number is required")
      if (!formData.idDocumentType) errors.push("Select a Government ID type")
      if (!formData.idDocumentNumber.trim()) errors.push("ID Document Number is required")
      if (!formData.idDocumentFile) errors.push("Upload your ID document")
    }
    if (step === 2) {
      if (!formData.shopUsername.trim()) errors.push("Shop Username is required")
      else if (formData.shopUsername.length < 3) errors.push("Shop username must be at least 3 characters")
      else if (formData.shopUsername.length > 30) errors.push("Shop username must be 30 characters or less")
      else if (!/^[a-zA-Z0-9._]+$/.test(formData.shopUsername)) errors.push("Shop username: only letters, numbers, periods and underscores allowed")
      else if (/^[._]/.test(formData.shopUsername)) errors.push("Shop username can't start with a period or underscore")
      else if (/[._]$/.test(formData.shopUsername)) errors.push("Shop username can't end with a period or underscore")
      else if (/[._]{2,}/.test(formData.shopUsername)) errors.push("Shop username can't have consecutive periods or underscores")
      if (!formData.shopName.trim()) errors.push("Shop Display Name is required")
      if (!formData.shopEmail.trim()) errors.push("Shop Email is required")
      else if (!/\S+@\S+\.\S+/.test(formData.shopEmail)) errors.push("Enter a valid shop email")
      if (!formData.shopPhone.trim()) errors.push("Shop Phone is required")
      if (!formData.shopPassword) errors.push("Store Password is required")
      else if (formData.shopPassword.length < 8) errors.push("Password must be at least 8 characters")
      if (!formData.shopConfirmPassword) errors.push("Confirm your password")
      else if (formData.shopPassword !== formData.shopConfirmPassword) errors.push("Passwords do not match")
      if (!formData.hasPhysicalStore) errors.push("Select whether you have a physical store")
      if (formData.selectedCategories.length === 0) errors.push("Select at least one product category")
      if (formData.selectedCategories.includes("other") && !formData.otherCategory.trim()) errors.push("Specify your other category")
      if (!formData.productCondition) errors.push("Select new or used parts")
      if (formData.productCondition && !formData.partsTypeConfirmed) errors.push("Confirm your parts type selection")
    }
    if (step === 3) {
      if (!formData.hasGst) errors.push("Select whether you have GST registration")
      if (formData.hasGst === "yes" && !formData.gstNumber.trim()) errors.push("Enter your GST number")
      if (formData.hasGst === "no" && !formData.taxIndependent) errors.push("Acknowledge the GST advisory to continue")
    }
    // Step 4 (bank details) is optional — user can fill in later from dashboard
    return errors
  }

  const handleNext = async () => {
    const errors = validateStep(currentStep)
    if (errors.length > 0) {
      setValidationErrors(errors)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    // Extra check on step 2 — block if shop username taken or still checking
    if (currentStep === 2) {
      if (shopUsernameStatus === "taken") {
        setValidationErrors(["Shop username is already taken — please choose another."])
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }
      if (shopUsernameStatus === "checking") {
        setValidationErrors(["Please wait while we check username availability."])
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }
    }
    setValidationErrors([])

    if (currentStep === 3 && formData.hasGst === "no" && !formData.taxIndependent) {
      setShowGstWarning(true)
      return
    }

    // Last step — submit to backend
    if (currentStep === steps.length) {
      setSubmitting(true)
      setSubmitError("")
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        const data = await res.json()

        if (!res.ok) {
          const msg = data.error || "Registration failed"
          if (msg.includes("Shop email is already registered") || msg.includes("shop email")) {
            setFieldErrors({ shopEmail: "This email is already registered. Use a different one." })
            setCurrentStep(2)
          } else if (msg.includes("Shop username is already taken") || msg.includes("shop_username")) {
            setFieldErrors({ shopUsername: "This shop username is taken — try another." })
            setCurrentStep(2)
          } else if (msg.includes("Owner email")) {
            setFieldErrors({ shopEmail: "This owner email is already linked to another shop." })
            setCurrentStep(2)
          } else {
            setSubmitError(msg)
          }
          setSubmitting(false)
          return
        }

        // Save auth data
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        localStorage.setItem("shop", JSON.stringify(data.shop))

        // Redirect to seller dashboard
        router.push("/seller/dashboard")
      } catch (err) {
        setSubmitError("Cannot connect to server. Make sure the backend is running.")
        setSubmitting(false)
      }
      return
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setValidationErrors([])
      setCurrentStep(currentStep - 1)
    }
  }

  const handleGstWarningClose = () => {
    setShowGstWarning(false)
    setCurrentStep(currentStep + 1)
  }

  const handlePartsTypeConfirm = () => {
    handleInputChange("partsTypeConfirmed", true)
    setShowPartsTypeWarning(false)
  }

  const handlePartsTypeCancel = () => {
    handleInputChange("productCondition", "")
    handleInputChange("partsTypeConfirmed", false)
    setShowPartsTypeWarning(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">PARTLY</span>
          </a>
          <div className="h-6 w-px bg-gray-200" />
          <a href="/seller" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Seller Portal</a>
          <div className="h-6 w-px bg-gray-200" />
          <p className="text-sm text-gray-500">Registration</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="relative">
            {/* Progress bar background */}
            <div className="absolute top-5 left-0 h-0.5 w-full bg-gray-200" />
            {/* Active progress bar */}
            <div
              className="absolute top-5 left-0 h-0.5 bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />

            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white text-sm font-medium transition-all",
                      step.id < currentStep
                        ? "border-blue-600 bg-blue-600 text-white"
                        : step.id === currentStep
                          ? "border-blue-600 text-blue-600"
                          : "border-gray-200 text-gray-400"
                    )}
                  >
                    {step.id < currentStep ? <Check className="h-5 w-5" /> : step.id}
                  </div>
                  <span
                    className={cn(
                      "mt-2 max-w-[100px] text-center text-xs",
                      step.id <= currentStep ? "text-gray-900 font-medium" : "text-gray-400"
                    )}
                  >
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-6 md:p-8">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">Please fill in all required fields</p>
                    <ul className="text-xs text-red-600 space-y-0.5">
                      {validationErrors.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Seller Account Creation - Owner Details & Password */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Seller Account Creation</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter your details as the business owner to create your seller account
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="idDocumentType">Government ID Type</Label>
                    <Select
                      value={formData.idDocumentType}
                      onValueChange={(value) => handleInputChange("idDocumentType", value)}
                    >
                      <SelectTrigger id="idDocumentType">
                        <SelectValue placeholder="Select ID document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                        <SelectItem value="pan">PAN Card</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="driving">Driving License</SelectItem>
                        <SelectItem value="voter">Voter ID Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Select a government-issued ID for verification</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idDocumentNumber">
                      {formData.idDocumentType === "aadhaar" ? "Aadhaar Number" :
                       formData.idDocumentType === "pan" ? "PAN Number" :
                       formData.idDocumentType === "passport" ? "Passport Number" :
                       formData.idDocumentType === "driving" ? "Driving License Number" :
                       formData.idDocumentType === "voter" ? "Voter ID Number" :
                       "ID Document Number"}
                    </Label>
                    <Input
                      id="idDocumentNumber"
                      placeholder={
                        formData.idDocumentType === "aadhaar" ? "XXXX XXXX XXXX" :
                        formData.idDocumentType === "pan" ? "ABCDE1234F" :
                        formData.idDocumentType === "passport" ? "A1234567" :
                        formData.idDocumentType === "driving" ? "DL-1234567890123" :
                        formData.idDocumentType === "voter" ? "ABC1234567" :
                        "Enter your ID number"
                      }
                      value={formData.idDocumentNumber}
                      onChange={(e) => handleInputChange("idDocumentNumber", e.target.value.toUpperCase())}
                      className="font-mono uppercase"
                      disabled={!formData.idDocumentType}
                    />
                    {formData.idDocumentType && (
                      <p className="text-xs text-muted-foreground">
                        {formData.idDocumentType === "aadhaar" ? "12-digit Aadhaar number" :
                         formData.idDocumentType === "pan" ? "10-character alphanumeric PAN" :
                         formData.idDocumentType === "passport" ? "Passport number as shown on document" :
                         formData.idDocumentType === "driving" ? "Driving license number" :
                         formData.idDocumentType === "voter" ? "Electoral photo ID card number" :
                         ""}
                      </p>
                    )}
                  </div>
                </div>

                {/* ID Document Upload */}
                <div className="space-y-2">
                  <Label>Upload ID Document</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Upload a clear photo or scan of your selected ID document for verification
                  </p>
                  
                  {!formData.idDocumentPreview ? (
                    <label 
                      htmlFor="idDocumentUpload"
                      className={cn(
                        "flex items-center justify-center gap-4 w-full h-20 border-2 border-dashed rounded-lg cursor-pointer transition-colors px-4",
                        formData.idDocumentType 
                          ? "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50" 
                          : "border-muted-foreground/25 bg-muted/30 cursor-not-allowed"
                      )}
                    >
                      <Upload className="w-6 h-6 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG or PDF (MAX. 5MB)</p>
                      </div>
                      <input 
                        id="idDocumentUpload" 
                        type="file" 
                        className="hidden" 
                        accept="image/png,image/jpeg,image/jpg,application/pdf"
                        onChange={handleFileUpload}
                        disabled={!formData.idDocumentType}
                      />
                    </label>
                  ) : (
                    <div className="relative border rounded-lg p-4">
                      <button
                        type="button"
                        onClick={removeUploadedFile}
                        className="absolute top-2 right-2 p-1 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      {formData.idDocumentPreview === "pdf" ? (
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-muted">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{formData.idDocumentFile?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              PDF Document • {((formData.idDocumentFile?.size || 0) / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4">
                          <img 
                            src={formData.idDocumentPreview} 
                            alt="ID Document Preview" 
                            className="w-32 h-24 object-cover rounded-lg border"
                          />
                          <div>
                            <p className="font-medium text-sm">{formData.idDocumentFile?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Image • {((formData.idDocumentFile?.size || 0) / 1024).toFixed(1)} KB
                            </p>
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Uploaded successfully
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!formData.idDocumentType && (
                    <p className="text-xs text-amber-600">Please select an ID document type first</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Date of Birth</Label>
                    <a href="#" className="text-sm text-primary hover:underline">
                      Why do we need this information?
                    </a>
                  </div>
                  <div className="grid gap-4 grid-cols-3">
                    <Select
                      value={formData.dobDay}
                      onValueChange={(value) => handleInputChange("dobDay", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={formData.dobMonth}
                      onValueChange={(value) => handleInputChange("dobMonth", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={formData.dobYear}
                      onValueChange={(value) => handleInputChange("dobYear", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 80 }, (_, i) => {
                          const year = new Date().getFullYear() - 18 - i
                          return (
                            <SelectItem key={year} value={String(year)}>
                              {year}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                </div>
            )}

            {/* Step 2: Shop Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Shop Information</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tell us about your business and what you sell
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="shopUsername">Shop Username</Label>
                    <Input
                      id="shopUsername"
                      placeholder="your-shop-name"
                      value={formData.shopUsername}
                      onChange={(e) => { handleInputChange("shopUsername", e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '')); setFieldErrors(p => ({ ...p, shopUsername: undefined })); setShopUsernameStatus("idle") }}
                      className={fieldErrors.shopUsername ? "border-red-400" : shopUsernameStatus === "taken" ? "border-red-400" : shopUsernameStatus === "available" ? "border-green-400" : ""}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {fieldErrors.shopUsername
                        ? <p className="text-xs text-red-500">{fieldErrors.shopUsername}</p>
                        : shopUsernameStatus === "taken"
                        ? <p className="text-xs text-red-500">✗ This username is already taken.</p>
                        : shopUsernameStatus === "available"
                        ? <p className="text-xs text-green-600 font-medium">✓ Available</p>
                        : shopUsernameStatus === "checking"
                        ? <p className="text-xs text-gray-400">Checking availability...</p>
                        : <p className="text-xs text-muted-foreground">
                            This will be your unique shop URL: marketplace.com/shop/<span className="font-medium">{formData.shopUsername || 'your-shop-name'}</span>
                          </p>
                      }
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shopName">Shop Display Name</Label>
                    <Input
                      id="shopName"
                      placeholder="My Auto Parts Store"
                      value={formData.shopName}
                      onChange={(e) => handleInputChange("shopName", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">This name will be shown to customers</p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="shopEmail">Email</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="text-amber-500 hover:text-amber-600 transition-colors">
                            <AlertTriangle className="h-4 w-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 text-sm" side="top">
                          <div className="flex gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-foreground">Use a business email</p>
                              <p className="text-muted-foreground mt-1">
                                We recommend using your own domain email (e.g., you@yourbusiness.com) instead of public emails like Gmail or Yahoo. This helps protect your store from unauthorized access and phishing attempts.
                              </p>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Input
                      id="shopEmail"
                      type="email"
                      placeholder="you@yourbusiness.com"
                      value={formData.shopEmail}
                      onChange={(e) => { handleInputChange("shopEmail", e.target.value); setFieldErrors(p => ({ ...p, shopEmail: undefined })) }}
                      className={fieldErrors.shopEmail ? "border-red-400" : ""}
                    />
                    {fieldErrors.shopEmail
                      ? <p className="text-xs text-red-500">{fieldErrors.shopEmail}</p>
                      : <p className="text-xs text-muted-foreground">Used for store login. Can be the same as your owner email.</p>
                    }
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shopPhone">Phone</Label>
                    <Input
                      id="shopPhone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.shopPhone}
                      onChange={(e) => handleInputChange("shopPhone", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Used for login & account recovery</p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="shopPassword">Store Password</Label>
                    <div className="relative">
                      <Input
                        id="shopPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a store password"
                        value={formData.shopPassword}
                        onChange={(e) => handleInputChange("shopPassword", e.target.value)}
                      />
<button
  type="button"
  onMouseDown={(e) => e.preventDefault()}
  onClick={() => {
    // Sync autofilled value to state before toggling
    const input = document.getElementById("shopPassword") as HTMLInputElement
    if (input && input.value !== formData.shopPassword) {
      handleInputChange("shopPassword", input.value)
    }
    setShowPassword(!showPassword)
  }}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
  tabIndex={-1}
  >
  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </button>
                    </div>
                    {/* Password strength indicator */}
                    {formData.shopPassword && (
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((level) => {
                            const strength = 
                              (formData.shopPassword.length >= 8 ? 1 : 0) +
                              (/[A-Z]/.test(formData.shopPassword) ? 1 : 0) +
                              (/[0-9]/.test(formData.shopPassword) ? 1 : 0) +
                              (/[^A-Za-z0-9]/.test(formData.shopPassword) ? 1 : 0)
                            return (
                              <div
                                key={level}
                                className={cn(
                                  "h-1 flex-1 rounded-full transition-colors",
                                  level <= strength
                                    ? strength <= 1 ? "bg-destructive" 
                                      : strength === 2 ? "bg-amber-500"
                                      : strength === 3 ? "bg-yellow-500"
                                      : "bg-green-500"
                                    : "bg-muted"
                                )}
                              />
                            )
                          })}
                        </div>
                        <div className="text-xs space-y-1">
                          <p className={cn(
                            "flex items-center gap-1",
                            formData.shopPassword.length >= 8 ? "text-green-600" : "text-muted-foreground"
                          )}>
                            {formData.shopPassword.length >= 8 ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 inline-block" />}
                            At least 8 characters
                          </p>
                          <p className={cn(
                            "flex items-center gap-1",
                            /[A-Z]/.test(formData.shopPassword) ? "text-green-600" : "text-muted-foreground"
                          )}>
                            {/[A-Z]/.test(formData.shopPassword) ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 inline-block" />}
                            At least one uppercase letter
                          </p>
                          <p className={cn(
                            "flex items-center gap-1",
                            /[0-9]/.test(formData.shopPassword) ? "text-green-600" : "text-muted-foreground"
                          )}>
                            {/[0-9]/.test(formData.shopPassword) ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 inline-block" />}
                            At least one number
                          </p>
                          <p className={cn(
                            "flex items-center gap-1",
                            /[^A-Za-z0-9]/.test(formData.shopPassword) ? "text-green-600" : "text-muted-foreground"
                          )}>
                            {/[^A-Za-z0-9]/.test(formData.shopPassword) ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 inline-block" />}
                            At least one special character
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shopConfirmPassword">Confirm Store Password</Label>
                    <div className="relative">
                      <Input
                        id="shopConfirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your store password"
                        value={formData.shopConfirmPassword}
                        onChange={(e) => handleInputChange("shopConfirmPassword", e.target.value)}
                      />
<button
  type="button"
  onMouseDown={(e) => e.preventDefault()}
  onClick={() => {
    // Sync autofilled value to state before toggling
    const input = document.getElementById("shopConfirmPassword") as HTMLInputElement
    if (input && input.value !== formData.shopConfirmPassword) {
      handleInputChange("shopConfirmPassword", input.value)
    }
    setShowConfirmPassword(!showConfirmPassword)
  }}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
  tabIndex={-1}
  >
  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </button>
                    </div>
                    {formData.shopConfirmPassword && (
                      <p className={cn(
                        "text-xs flex items-center gap-1",
                        formData.shopPassword === formData.shopConfirmPassword ? "text-green-600" : "text-destructive"
                      )}>
                        {formData.shopPassword === formData.shopConfirmPassword ? (
                          <><Check className="w-3 h-3" /> Passwords match</>
                        ) : (
                          <><AlertTriangle className="w-3 h-3" /> Passwords do not match</>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Do you have a physical store?</Label>
                  <RadioGroup
                    value={formData.hasPhysicalStore}
                    onValueChange={(value) => handleInputChange("hasPhysicalStore", value)}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="physical-yes" />
                      <Label htmlFor="physical-yes" className="font-normal cursor-pointer">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="physical-no" />
                      <Label htmlFor="physical-no" className="font-normal cursor-pointer">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>What kind of products are you selling?</Label>
                  <p className="text-xs text-muted-foreground">Select all that apply</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {productCategories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={category.id}
                          checked={formData.selectedCategories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <Label htmlFor={category.id} className="font-normal cursor-pointer">
                          {category.label}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {formData.selectedCategories.includes("other") && (
                    <div className="mt-3 space-y-2">
                      <Label htmlFor="otherCategory">Please specify your category</Label>
                      <Input
                        id="otherCategory"
                        placeholder="e.g., Performance parts, Vintage car parts"
                        value={formData.otherCategory}
                        onChange={(e) => handleInputChange("otherCategory", e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Is your shop selling new or used products?</Label>
                  <RadioGroup
                    value={formData.productCondition}
                    onValueChange={(value) => handleInputChange("productCondition", value)}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="new" id="condition-new" />
                      <Label htmlFor="condition-new" className="font-normal cursor-pointer">
                        New parts
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="used" id="condition-used" />
                      <Label htmlFor="condition-used" className="font-normal cursor-pointer">
                        Used parts
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 3: Verify Tax Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Verify Tax Details</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    GST number is mandatory to sell online
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Do you have GST registration?</Label>
                  <RadioGroup
                    value={formData.hasGst}
                    onValueChange={(value) => {
                      handleInputChange("hasGst", value)
                      if (value === "yes") {
                        handleInputChange("taxIndependent", false)
                      }
                    }}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="gst-yes" />
                      <Label htmlFor="gst-yes" className="font-normal cursor-pointer">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="gst-no" />
                      <Label htmlFor="gst-no" className="font-normal cursor-pointer">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.hasGst === "yes" && (
                  <div className="space-y-2">
                    <Label htmlFor="gstNumber" className="flex items-center gap-2">
                      15 digit GST number
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        title="GST number format: 2 digits state code + 10 digit PAN + 1 digit entity + 1 digit Z + 1 digit checksum"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </Label>
                    <Input
                      id="gstNumber"
                      placeholder="e.g., 22AAAAA0000A1Z5"
                      maxLength={15}
                      value={formData.gstNumber}
                      onChange={(e) => handleInputChange("gstNumber", e.target.value.toUpperCase())}
                      className="font-mono uppercase"
                    />
                  </div>
                )}

                {formData.hasGst === "no" && (
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 rounded-lg border border-border bg-muted/50 p-4">
                      <Checkbox
                        id="taxIndependent"
                        checked={formData.taxIndependent}
                        onCheckedChange={(checked) => {
                          handleInputChange("taxIndependent", checked as boolean)
                          if (checked) {
                            setShowGstWarning(true)
                          }
                        }}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="taxIndependent" className="cursor-pointer">
                          I do my own tax work independently
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          I understand that I am responsible for my own tax compliance and will register for GST when required.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Bank Details */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Bank Account</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add your bank account for receiving payments. <span className="text-amber-600 font-medium">Optional — you can add this later from your seller dashboard.</span>
                  </p>
                </div>

                <Collapsible className="rounded-lg border border-border">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 transition-colors">
                    <p className="text-sm text-foreground font-medium">
                      You only pay when you sell. No listing fees, no hidden costs.
                    </p>
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4 space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Product Price Range</th>
                            <th className="text-left py-2 px-4 text-muted-foreground font-medium">Commission</th>
                            <th className="text-left py-2 pl-4 text-muted-foreground font-medium">Fixed Closing Fee</th>
                          </tr>
                        </thead>
                        <tbody className="text-foreground">
                          <tr className="border-b border-border/50">
                            <td className="py-3 pr-4">{"₹0 – ₹1,000"}</td>
                            <td className="py-3 px-4">0%</td>
                            <td className="py-3 pl-4">{"₹15"}</td>
                          </tr>
                          <tr className="border-b border-border/50">
                            <td className="py-3 pr-4">{"₹1,001 – ₹6,000"}</td>
                            <td className="py-3 px-4">5%</td>
                            <td className="py-3 pl-4">{"₹30"}</td>
                          </tr>
                          <tr className="border-b border-border/50">
                            <td className="py-3 pr-4">{"₹6,001 – ₹50,000"}</td>
                            <td className="py-3 px-4">10%</td>
                            <td className="py-3 pl-4">{"₹100"}</td>
                          </tr>
                          <tr>
                            <td className="py-3 pr-4">{"Above ₹50,000"}</td>
                            <td className="py-3 px-4">{"₹3,000"} <span className="text-muted-foreground">(Flat)</span></td>
                            <td className="py-3 pl-4">{"₹250"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronDown className="h-4 w-4" />
                        <span>Additional Details</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3 space-y-3 text-sm text-muted-foreground">
                        <div className="flex gap-2">
                          <span className="font-medium text-foreground">Payment Processing:</span>
                          <span>A standard 2% Payment Gateway fee applies to all digital transactions.</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-medium text-foreground">Taxes:</span>
                          <span>18% GST is applicable only on the platform fees (Commission + Closing + PG fees), not on your product&apos;s sale price.</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-medium text-foreground">Net Payout:</span>
                          <span>Your final earnings are calculated after deducting the above fees and taxes from the sale price.</span>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CollapsibleContent>
                </Collapsible>

                <div className="space-y-2">
                  <Label htmlFor="payToName">Pay to the order of</Label>
                  <Input
                    id="payToName"
                    placeholder="FULL NAME AS ON BANK ACCOUNT"
                    value={formData.payToName}
                    onChange={(e) => handleInputChange("payToName", e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                  <p className="text-xs text-muted-foreground">Must exactly match the name on your bank account</p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC</Label>
                    <Input
                      id="ifscCode"
                      placeholder="e.g., SBIN0001234"
                      value={formData.ifscCode}
                      onChange={(e) => handleInputChange("ifscCode", e.target.value.toUpperCase())}
                      className="uppercase font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account number</Label>
                    <Input
                      id="accountNumber"
                      placeholder="Enter your account number"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Account type</Label>
                    <a href="#" className="text-sm text-primary hover:underline">
                      What type of account should I choose?
                    </a>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange("accountType", "individual")}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                        formData.accountType === "individual"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      <User className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Individual</div>
                        <div className="text-sm text-muted-foreground">When you are selling as yourself</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange("accountType", "business")}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                        formData.accountType === "business"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      <Building2 className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Business</div>
                        <div className="text-sm text-muted-foreground">When you are selling as a business</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAddress">Address</Label>
                  <Input
                    id="bankAddress"
                    placeholder="Enter your address"
                    value={formData.bankAddress}
                    onChange={(e) => handleInputChange("bankAddress", e.target.value)}
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankCity">City</Label>
                    <Input
                      id="bankCity"
                      placeholder="Enter your city"
                      value={formData.bankCity}
                      onChange={(e) => handleInputChange("bankCity", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankPostalCode">Postal code</Label>
                    <Input
                      id="bankPostalCode"
                      placeholder="Enter postal code"
                      value={formData.bankPostalCode}
                      onChange={(e) => handleInputChange("bankPostalCode", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankCountry">Country</Label>
                  <Input
                    id="bankCountry"
                    value="India"
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Currently available for Indian sellers only</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankPhone">Phone number</Label>
                  <Input
                    id="bankPhone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.bankPhone}
                    onChange={(e) => handleInputChange("bankPhone", e.target.value)}
                  />
                </div>

              </div>
            )}

            {/* Submit Error */}
            {submitError && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || submitting}
                className="px-6"
              >
                Back
              </Button>
              <Button onClick={handleNext} disabled={submitting} className="gap-2 px-6">
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating Account...</>
                ) : currentStep === steps.length ? (
                  <><Check className="h-4 w-4" /> Submit</>
                ) : (
                  <>{`Continue`}<ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* GST Warning Dialog */}
      <Dialog open={showGstWarning} onOpenChange={setShowGstWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning-foreground">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              GST Registration Advisory
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-left pt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground block mb-2">Important Notice:</span>
                <span className="block">GST registration is mandatory if your annual turnover exceeds:</span>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>₹40 lakhs for goods (₹20 lakhs for services) in most states</li>
                  <li>₹20 lakhs for goods in special category states</li>
                </ul>
                <span className="block mt-3">
                  We advise you to register for GST and add it to your profile later. You can update your GST details from your seller dashboard at any time.
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowGstWarning(false)} className="w-full sm:w-auto">
              Go back
            </Button>
            <Button onClick={handleGstWarningClose} className="w-full sm:w-auto">
              I understand, continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Parts Type Warning Dialog */}
      <Dialog open={showPartsTypeWarning} onOpenChange={setShowPartsTypeWarning}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <span>{formData.productCondition === "new" ? "New Parts Only" : "Used Parts Only"} Confirmation</span>
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-left pt-2 space-y-3">
                <p className="font-medium text-foreground">Important Policy Notice:</p>
                <p>
                  You have selected to sell <span className="font-semibold">{formData.productCondition === "new" ? "NEW" : "USED"}</span> vehicle parts only.
                </p>
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive font-medium">
                    Warning: You can only sell either NEW or USED parts - not both.
                  </p>
                  <p className="text-sm text-destructive mt-1">
                    If you mix both types, you will be banned from selling and this may result in losing your payout.
                  </p>
                </div>
                <p className="text-sm">
                  Are you sure you want to proceed with selling <span className="font-semibold">{formData.productCondition === "new" ? "new" : "used"}</span> parts only?
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={handlePartsTypeCancel} className="w-full sm:w-auto">
              Cancel, choose again
            </Button>
            <Button onClick={handlePartsTypeConfirm} className="w-full sm:w-auto">
              I understand, confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}