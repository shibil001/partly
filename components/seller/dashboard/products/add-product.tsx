"use client"

import { useState, useRef, useEffect } from "react"
import {
  ChevronLeft, ChevronUp, ChevronDown, Copy, Bold, Underline,
  Italic, Strikethrough, Link, List, ListOrdered, Code,
  Upload, X, Plus, FileText, Search, Truck, Zap, Check,
  FileStack, Trash2, AlertCircle, ImageIcon, MapPin, Building2, Star, Bookmark
} from "lucide-react"

type FlairTag = "OEM" | "Aftermarket" | "Genuine" | null
type ProductStatus = "Published" | "Draft" | "Inactive" | "Stock Out"

interface SavedLocation {
  id: string
  label: string
  state: string
  district: string
  pincode: string
  location: string
}

const getSavedLocationsKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem("seller_user") || "{}")
    const id = user?.id || "default"
    return `partly_seller_saved_locations_${id}`
  } catch { return "partly_seller_saved_locations_default" }
}

interface Category {
  id: string
  name: string
}

interface AddProductProps {
  categories: Category[]
  onSave: (product: any) => void
  onCancel: () => void
  editingProduct?: any | null
  products?: any[]
  onEditProduct?: (product: any) => void
  onDeleteDraft?: (id: string) => void
}

const MAX_IMAGES = 7
const MIN_IMAGES = 3

const INDIA_DATA: Record<string, string[]> = {
  "Andhra Pradesh": ["Alluri Sitharama Raju", "Anakapalli", "Anantapur", "Annamayya", "Bapatla", "Chittoor", "East Godavari", "Eluru", "Guntur", "Kadapa", "Kakinada", "Konaseema", "Krishna", "Kurnool", "Nandyal", "Nellore", "NTR", "Palnadu", "Prakasam", "Sri Sathya Sai", "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari"],
  "Arunachal Pradesh": ["Tawang", "West Kameng", "East Kameng", "Papum Pare", "Kurung Kumey", "Kra Daadi", "Lower Subansiri", "Upper Subansiri", "West Siang", "East Siang", "Siang", "Upper Siang", "Lower Siang", "Lower Dibang Valley", "Dibang Valley", "Anjaw", "Lohit", "Namsai", "Changlang", "Tirap", "Longding"],
  "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Korea", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
  "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurgaon", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahebganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
  "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Tirunelveli", "Erode", "Vellore", "Thoothukudi"],
  "Uttar Pradesh": ["Lucknow", "Kanpur Nagar", "Varanasi", "Agra", "Prayagraj", "Ghaziabad", "Meerut", "Noida", "Bareilly"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
  "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
  "Mizoram": ["Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saitual", "Serchhip"],
  "Nagaland": ["Chumoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren", "Phek", "Tseminyu", "Tuensang", "Wokha", "Zunheboto"],
  "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Sonepur", "Sundargarh"],
  "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Mohali", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "Shaheed Bhagat Singh Nagar", "Tarn Taran"],
  "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  "Sikkim": ["East Sikkim", "North Sikkim", "Pakyong", "Soreng", "South Sikkim", "West Sikkim"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"],
  "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
  "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Murshidabad", "Malda", "North 24 Parganas", "South 24 Parganas", "Hooghly", "Burdwan", "Bankura", "Birbhum", "Cooch Behar", "Jalpaiguri", "Purulia"],
  "Delhi (UT)": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Jammu & Kashmir (UT)": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kupwara"],
  "Ladakh (UT)": ["Leh", "Kargil"],
  "Lakshadweep (UT)": ["Lakshadweep"],
  "Puducherry (UT)": ["Puducherry", "Karaikal", "Mahe", "Yanam"],
  "Chandigarh (UT)": ["Chandigarh"],
  "Andaman & Nicobar Islands (UT)": ["Nicobar", "North and Middle Andaman", "South Andaman"],
}

const emptyForm = {
  productCode: "",
  sku: "",
  partNumber: "",
  name: "",
  brand: "",
  category: "",
  description: "",
  keywords: "",
  productId: `PROD-${Date.now()}`,
  images: [] as string[],
  price: "",
  originalPrice: "",
  currency: "INR",
  discountPercent: "",
  stock: "",
  stockUnit: "PCS",
  minStock: "",
  maxStock: "",
  location: "",
  district: "",
  state: "",
  pincode: "",
  status: "Draft" as ProductStatus,
  freeShipping: false,
  fastShipping: false,
  flairTag: null as FlairTag,
  vehicleModel: "",
  material: "",
  colour: "",
  year: "",
  weight: "",
  weightUnit: "kg",
  measurements: "",
  condition: "",
  size: "",
  sizeChart: "",
  fitment: "",
  warranty: "",
  warrantyTerms: "",
    customFields: [] as { label: string; value: string }[],
  includes: "",
  features: "",
  vehicleType: [] as string[],
  accessoryType: [] as string[],
}


// ── WYSIWYG Features Editor ─────────────────────────────────────────────────
const BLOCK_STYLES = [
  { label: "Text",          tag: "p",  icon: "Aᵢ" },
  { label: "Header",        tag: "h1", icon: "H1" },
  { label: "Title",         tag: "h2", icon: "H2" },
  { label: "Subtitle",      tag: "h3", icon: "H3" },
  { label: "Bulleted list", tag: "ul", icon: "•≡" },
  { label: "Numbered list", tag: "ol", icon: "1≡" },
]

function FeaturesEditor({
  value, onChange, open, onToggle,
}: { value: string; onChange: (html: string) => void; open: boolean; onToggle: () => void }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [blockDropOpen, setBlockDropOpen] = useState(false)
  const [activeBlock, setActiveBlock] = useState("Text")
  const isUpdatingFromProp = useRef(false)

  // Sync external value → editor (only on mount or when editing product changes)
  useEffect(() => {
    if (!editorRef.current) return
    // Only overwrite if content differs to avoid caret jumping
    if (editorRef.current.innerHTML !== (value || "")) {
      isUpdatingFromProp.current = true
      editorRef.current.innerHTML = value || ""
      isUpdatingFromProp.current = false
    }
  }, [value])

  const emitChange = () => {
    if (!editorRef.current || isUpdatingFromProp.current) return
    onChange(editorRef.current.innerHTML)
  }

  const exec = (cmd: string, arg?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, arg)
    emitChange()
  }

  const applyBlock = (tag: string, label: string) => {
    editorRef.current?.focus()
    setActiveBlock(label)
    setBlockDropOpen(false)
    if (tag === "ul" || tag === "ol") {
      document.execCommand("insertUnorderedList", false)
      if (tag === "ol") document.execCommand("insertOrderedList", false)
      // toggle: if already a list of wrong type, switch
      if (tag === "ol") {
        document.execCommand("insertOrderedList", false)
      } else {
        document.execCommand("insertUnorderedList", false)
      }
    } else {
      document.execCommand("formatBlock", false, tag)
    }
    emitChange()
  }

  // Detect active block from selection
  const updateActiveBlock = () => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    let node: Node | null = sel.anchorNode
    while (node && node !== editorRef.current) {
      const name = (node as Element).tagName?.toLowerCase()
      const found = BLOCK_STYLES.find(b => b.tag === name)
      if (found) { setActiveBlock(found.label); return }
      node = node.parentNode
    }
    setActiveBlock("Text")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Tab → indent
    if (e.key === "Tab") { e.preventDefault(); exec("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;") }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
        <h3 className="text-base font-semibold text-gray-900">PRODUCT FEATURES</h3>
        {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="border border-gray-200 rounded-xl overflow-visible">

            {/* Toolbar */}
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-gray-50 flex-wrap">

              {/* Block style dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBlockDropOpen(v => !v)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200 bg-white"
                >
                  {activeBlock}
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>
                {blockDropOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setBlockDropOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                      {BLOCK_STYLES.map(({ label, tag, icon }) => (
                        <button
                          key={label}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); applyBlock(tag, label) }}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                            activeBlock === label
                              ? "bg-blue-50 text-blue-600 font-semibold"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-xs font-mono w-6 text-gray-400">{icon}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="w-px h-5 bg-gray-200 mx-0.5" />

              {/* Inline format buttons */}
              {[
                { Icon: Bold,          cmd: "bold",          title: "Bold" },
                { Icon: Italic,        cmd: "italic",        title: "Italic" },
                { Icon: Underline,     cmd: "underline",     title: "Underline" },
                { Icon: Strikethrough, cmd: "strikeThrough", title: "Strikethrough" },
              ].map(({ Icon, cmd, title }) => (
                <button
                  key={cmd}
                  type="button"
                  title={title}
                  onMouseDown={(e) => { e.preventDefault(); exec(cmd) }}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}

              <div className="w-px h-5 bg-gray-200 mx-0.5" />

              {/* List buttons */}
              <button
                type="button"
                title="Bulleted list"
                onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList") }}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Numbered list"
                onMouseDown={(e) => { e.preventDefault(); exec("insertOrderedList") }}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <ListOrdered className="h-4 w-4" />
              </button>
            </div>

            {/* Editable area */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={emitChange}
              onKeyUp={updateActiveBlock}
              onMouseUp={updateActiveBlock}
              onKeyDown={handleKeyDown}
              data-placeholder="Enter product features — use bold, lists, headings to structure them clearly..."
              className="min-h-[180px] px-4 py-3 text-sm text-gray-800 focus:outline-none prose prose-sm max-w-none
                [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-1
                [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-1
                [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1
                [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                [&_li]:mb-0.5 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through
                empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Formatting is saved as-is and shown exactly the same way on the product page.</p>
        </div>
      )}
    </div>
  )
}
// ────────────────────────────────────────────────────────────────────────────

export function AddProduct({ categories, onSave, onCancel, editingProduct, products = [], onEditProduct, onDeleteDraft }: AddProductProps) {
  const [activeSubTab, setActiveSubTab] = useState("new")
  const [specificationsOpen, setSpecificationsOpen] = useState(true)
  const [featuresOpen, setFeaturesOpen] = useState(true)
  const [conditionOpen, setConditionOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [stockUnitOpen, setStockUnitOpen] = useState(false)
  const [weightUnitOpen, setWeightUnitOpen] = useState(false)
  const [stateOpen, setStateOpen] = useState(false)
  const [districtOpen, setDistrictOpen] = useState(false)
  const [stateSearch, setStateSearch] = useState("")
  const [districtSearch, setDistrictSearch] = useState("")
  const [categorySearch, setCategorySearch] = useState("")
  const [stateHighlight, setStateHighlight] = useState(-1)
  const [districtHighlight, setDistrictHighlight] = useState(-1)
  const stateListRef = useRef<HTMLDivElement>(null)
  const districtListRef = useRef<HTMLDivElement>(null)
  const [isUsedSeller] = useState(() => {
    try {
      const shop = JSON.parse(localStorage.getItem("seller_shop") || "{}")
      return shop?.product_condition === "used"
    } catch { return false }
  })
  const [imageError, setImageError] = useState<string | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [warrantyPdf, setWarrantyPdf] = useState<{ name: string } | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [editSearch, setEditSearch] = useState("")
  const [draftSaved, setDraftSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [publishSaved, setPublishSaved] = useState(false)
  const [keywordInput, setKeywordInput] = useState("")
  const [includesInput, setIncludesInput] = useState("")
  const [maxStockManuallySet, setMaxStockManuallySet] = useState(false)
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>(() => {
    try { return JSON.parse(localStorage.getItem(getSavedLocationsKey()) || "[]") } catch { return [] }
  })
  const [locationLabelInput, setLocationLabelInput] = useState("")
  const [locationSavedFeedback, setLocationSavedFeedback] = useState(false)
  const [locationOpen, setLocationOpen] = useState(true)
  const [confirmDeleteLocId, setConfirmDeleteLocId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const stateRef = useRef<HTMLDivElement>(null)
  const districtRef = useRef<HTMLDivElement>(null)
  const [stateRect, setStateRect] = useState<DOMRect | null>(null)
  const [districtRect, setDistrictRect] = useState<DOMRect | null>(null)
  const sizeChartRef = useRef<HTMLInputElement>(null)

  const draftProducts = products.filter((p: any) => p.status === "Draft")
  const publishedProducts = products.filter((p: any) => p.status === "Published")
  const searchedPublished = editSearch.trim().length >= 1
    ? publishedProducts.filter((p: any) =>
        p.name.toLowerCase().includes(editSearch.toLowerCase()) ||
        p.partNumber?.toLowerCase().includes(editSearch.toLowerCase()) ||
        p.brand?.toLowerCase().includes(editSearch.toLowerCase())
      )
    : publishedProducts

  const [form, setForm] = useState({ ...emptyForm })

  useEffect(() => {
    if (editingProduct) {
      setForm({
        productCode: editingProduct.productCode || "",
        sku: editingProduct.sku || "",
        partNumber: editingProduct.partNumber || "",
        name: editingProduct.name || "",
        brand: editingProduct.brand || "",
        category: editingProduct.category || "",
        description: editingProduct.description || "",
        keywords: editingProduct.keywords || "",
        productId: editingProduct.id || "",
        images: [
          ...(editingProduct.image ? [editingProduct.image] : []),
          ...(editingProduct.images || []),
        ].filter(Boolean),
        price: editingProduct.price?.toString() || "",
        originalPrice: editingProduct.originalPrice?.toString() || "",
        currency: editingProduct.currency || "INR",
        discountPercent: editingProduct.discountPercent?.toString() || "",
        stock: editingProduct.stock?.toString() || "",
        stockUnit: editingProduct.stockUnit || "PCS",
        minStock: editingProduct.minStock?.toString() || "",
        maxStock: editingProduct.maxStock?.toString() || "",
        location: editingProduct.location || "",
        district: editingProduct.district || "",
        state: editingProduct.state || "",
        pincode: editingProduct.pincode || "",
        status: editingProduct.status || "Draft",
        freeShipping: editingProduct.freeShipping || false,
        fastShipping: editingProduct.fastShipping || false,
        flairTag: editingProduct.flairTag || null,
        vehicleModel: editingProduct.vehicleModel || "",
        material: editingProduct.material || "",
        colour: editingProduct.colour || "",
        year: editingProduct.year || "",
        weight: editingProduct.weight || "",
        weightUnit: editingProduct.weightUnit || "kg",
        measurements: editingProduct.measurements || "",
        condition: editingProduct.condition || "",
        size: editingProduct.size || "",
        sizeChart: editingProduct.sizeChart || "",
        fitment: editingProduct.fitment || "",
        warranty: editingProduct.warranty || "",
        warrantyTerms: editingProduct.warrantyTerms || "",
        includes: editingProduct.includes || "",
        customFields: (editingProduct as any).customFields || [],
        features: editingProduct.features || "",
        vehicleType: editingProduct.vehicleType || [],
        accessoryType: editingProduct.accessoryType || [],
      })
      setMaxStockManuallySet(!!(editingProduct.maxStock && editingProduct.maxStock !== editingProduct.stock))
      setActiveSubTab("new")
      // Restore PDF preview if there's a saved warranty PDF
      if (editingProduct.warrantyTerms?.startsWith("data:application/pdf")) {
        setWarrantyPdf({ name: "warranty-terms.pdf" })
      } else {
        setWarrantyPdf(null)
      }
      // Auto-detect if specs have data
      const hasSpecs = !!(editingProduct.vehicleModel || editingProduct.material || editingProduct.colour || editingProduct.year || editingProduct.weight || editingProduct.measurements || editingProduct.condition || editingProduct.fitment || editingProduct.warranty || editingProduct.includes || editingProduct.warrantyTerms)
      setSpecificationsOpen(hasSpecs)
    }
  }, [editingProduct])

  const resetForm = () => {
    setForm({ ...emptyForm, productId: `PROD-${Date.now()}` })
    setImageError(null)
    setPriceError(null)
    setWarrantyPdf(null)
  }

  const validatePrice = (selling: number, original: number) => {
    if (original > 0 && selling > original) {
      setPriceError("Selling price can't be higher than original price")
      return false
    }
    setPriceError(null)
    return true
  }

  const handleOriginalPriceChange = (value: string) => {
    const orig = parseFloat(value) || 0
    const disc = parseFloat(form.discountPercent) || 0
    if (orig > 0 && disc > 0) {
      const selling = Math.round(orig - (orig * disc / 100))
      validatePrice(selling, orig)
      setForm(p => ({ ...p, originalPrice: value, price: selling.toString() }))
    } else {
      setForm(p => ({ ...p, originalPrice: value }))
    }
  }

  const handleDiscountChange = (value: string) => {
    const disc = parseFloat(value) || 0
    const orig = parseFloat(form.originalPrice) || 0
    if (orig > 0 && disc >= 0 && disc <= 100) {
      const selling = Math.round(orig - (orig * disc / 100))
      validatePrice(selling, orig)
      setForm(p => ({ ...p, discountPercent: value, price: selling.toString() }))
    } else {
      setForm(p => ({ ...p, discountPercent: value }))
    }
  }

  const handleSellingPriceChange = (value: string) => {
    const selling = parseFloat(value) || 0
    const orig = parseFloat(form.originalPrice) || 0
    validatePrice(selling, orig)
    if (orig > 0 && selling > 0 && selling <= orig) {
      const disc = Math.round(((orig - selling) / orig) * 100)
      setForm(p => ({ ...p, price: value, discountPercent: disc.toString() }))
    } else {
      setForm(p => ({ ...p, price: value }))
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    setImageError(null)
    if (!files || files.length === 0) return
    const remaining = MAX_IMAGES - form.images.length
    if (remaining <= 0) { setImageError(`Maximum ${MAX_IMAGES} images allowed`); return }
    const validFiles = Array.from(files).slice(0, remaining).filter(file => {
      if (file.size > 5 * 1024 * 1024) { setImageError(`"${file.name}" exceeds 5MB`); return false }
      if (!file.type.startsWith("image/")) { setImageError("Please upload valid image files"); return false }
      return true
    })
    for (const file of validFiles) {
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve((reader.result as string).split(",")[1])
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        const formData = new FormData()
        formData.append("image", base64)
        formData.append("key", "02b4c7432d64053cdaebd47e3a9918ab")
        const imgRes = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: formData })
        const imgData = await imgRes.json()
        if (imgData.success) {
          setForm(p => ({ ...p, images: [...p.images, imgData.data.url] }))
        } else {
          setImageError("Image upload failed, try again")
        }
      } catch {
        setImageError("Image upload failed, try again")
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setPdfError(null)
    if (!file) return
    if (file.type !== "application/pdf") { setPdfError("Please upload a PDF file"); return }
    if (file.size > 5 * 1024 * 1024) { setPdfError("PDF exceeds 5MB limit"); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      setWarrantyPdf({ name: file.name })
      setForm(p => ({ ...p, warrantyTerms: base64 }))
    }
    reader.readAsDataURL(file)
    if (pdfInputRef.current) pdfInputRef.current.value = ""
  }


  const handleSaveAsDraft = () => {
    if (isSaving) return
    setIsSaving(true)
    onSave({ ...buildProduct(), status: "Draft" })
    setTimeout(() => {
      setIsSaving(false)
      setDraftSaved(true)
      resetForm()
      setTimeout(() => setDraftSaved(false), 2000)
    }, 500)
  }

  const handlePublish = () => {
    const selling = parseFloat(form.price) || 0
    const orig = parseFloat(form.originalPrice) || 0
    if (orig > 0 && selling > orig) { setPriceError("Selling price can't be higher than original price"); return }
    if (form.name.length > 180) { return }
    setPublishSaved(true)
    setTimeout(() => {
      setPublishSaved(false)
      onSave({ ...buildProduct(), status: "Published" })
    }, 1000)
  }

  const buildProduct = () => ({
    ...(editingProduct?.id ? { id: editingProduct.id } : {}),
    productCode: form.productCode,
    sku: form.sku,
    partNumber: form.partNumber,
    name: form.name || "Untitled",
    brand: form.brand,
    category: form.category,
    description: form.description,
    image: form.images[0] || "",
    images: form.images.slice(1),
    price: parseFloat(form.price) || 0,
    originalPrice: parseFloat(form.originalPrice) || 0,
    currency: form.currency,
    discountPercent: Math.trunc(Number(form.discountPercent)) || 0,
    stock: Math.trunc(Number(form.stock)) || 0,
    stockUnit: form.stockUnit,
    minStock: Math.trunc(Number(form.minStock)) || 0,
    maxStock: Math.trunc(Number(form.maxStock)) || 0,
    location: form.location,
    district: form.district,
    state: form.state,
    pincode: form.pincode,
    status: form.status,
    freeShipping: form.freeShipping,
    fastShipping: form.fastShipping,
    flairTag: form.flairTag,
    vehicleModel: form.vehicleModel,
    material: form.material,
    colour: form.colour,
    year: form.year,
    weight: form.weight,
    weightUnit: form.weightUnit,
    measurements: form.measurements,
    condition: form.condition,
    size: form.size,
    sizeChart: form.sizeChart,
    fitment: form.fitment,
    warranty: form.warranty,
    warrantyTerms: form.warrantyTerms,
    includes: form.includes,
    features: form.features,
    vehicleType: form.vehicleType,
    accessoryType: form.accessoryType,
    keywords: [
      form.keywords,
      form.vehicleType.join(", "),
      form.accessoryType.join(", "),
    ].filter(Boolean).join(", "),
    partType: isUsedSeller ? "used" : "new",
    customFields: form.customFields || [],
  })

  const getFlairStyle = (tag: FlairTag) => {
    if (tag === "OEM") return "bg-blue-600 text-white border-transparent"
    if (tag === "Aftermarket") return "bg-orange-500 text-white border-transparent"
    if (tag === "Genuine") return "bg-green-600 text-white border-transparent"
    return "border-gray-200 text-gray-500 hover:border-gray-400"
  }

  const currencySymbol = form.currency === "INR" ? "₹" : form.currency === "EUR" ? "€" : "$"

  return (
    <div className="space-y-4 max-w-4xl">

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {editingProduct ? `Editing: ${editingProduct.name}` : "Add or Edit Product"}
          </h2>
        </div>
        <div className="flex items-center gap-6 border-b border-gray-200">
          {[
            { id: "draft", label: `${draftProducts.length} Draft` },
            { id: "edit", label: "Edit Published" },
            { id: "new", label: "New Product" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveSubTab(tab.id)}
              className={`text-sm font-medium pb-3 border-b-2 transition-colors ${
                activeSubTab === tab.id ? "text-blue-600 border-blue-600" : "text-gray-400 border-transparent hover:text-gray-700"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Draft Products Tab */}
      {activeSubTab === "draft" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Draft Products ({draftProducts.length})</h3>
          {draftProducts.length === 0 ? (
            <div className="py-12 text-center">
              <FileStack className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No draft products yet</p>
              <button onClick={() => setActiveSubTab("new")} className="mt-3 text-sm text-blue-600 hover:underline">
                Create a new product
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {draftProducts.map((product: any) => (
                <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {product.image
                      ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-5 w-5 text-gray-300" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{product.brand} | {isUsedSeller ? `Part No: ${product.partNumber}` : `SKU: ${product.sku}`}</p>
                    <p className="text-xs text-gray-500 mt-0.5">₹{product.price?.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => { if (onEditProduct) onEditProduct(product); setActiveSubTab("new") }}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                      Edit
                    </button>
                    {onDeleteDraft && (
                      <button onClick={() => onDeleteDraft(product.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Published Tab */}
      {activeSubTab === "edit" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Edit Published Product</h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search by name, Part Number or brand..." value={editSearch}
              onChange={(e) => setEditSearch(e.target.value)} autoFocus
              className="w-full pl-9 pr-4 py-2 border-2 border-blue-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {searchedPublished.length === 0 ? (
              <div className="py-12 text-center">
                <Search className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No published products found</p>
              </div>
            ) : (
              searchedPublished.map((product: any) => (
                <div key={product.id}
                  onClick={() => { if (onEditProduct) onEditProduct(product); setActiveSubTab("new"); setEditSearch("") }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {product.image
                      ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-5 w-5 text-gray-300" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{product.brand} | {isUsedSeller ? `Part No: ${product.partNumber}` : `SKU: ${product.sku}`}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">Published</span>
                      <span className="text-xs text-gray-500">₹{product.price?.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* New / Edit Product Form */}
      {activeSubTab === "new" && (
        <>
          {/* Frontend Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-500 mb-4">Frontend Preview</p>
            <div className="flex gap-6">
              <div className="shrink-0 relative">
                <div className="w-32 h-32 rounded-lg overflow-hidden border bg-gray-100 relative flex items-center justify-center">
                  {form.images[0] ? (
                    <img src={form.images[0]} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-gray-300" />
                  )}
                  {form.flairTag && (
                    <div className={`absolute top-0 left-0 px-2 py-0.5 text-xs font-semibold ${getFlairStyle(form.flairTag)}`}>
                      {form.flairTag}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2 flex-1">
                <p className="text-sm text-gray-400">{form.brand || "Brand"} | {isUsedSeller ? `Part No: ${form.partNumber || "Part No"}` : `SKU: ${form.sku || "SKU"}`}</p>
                <h3 className="text-lg font-bold text-gray-900 uppercase">{form.name || "PRODUCT NAME"}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {form.freeShipping && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded font-semibold">FREE SHIPPING</span>}
                  {form.fastShipping && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-semibold flex items-center gap-1"><Zap className="h-3 w-3" /> FAST SHIPPING</span>}
                  {parseInt(form.discountPercent) > 0 && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-semibold">{form.discountPercent}% OFF</span>}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-xl font-bold ${priceError ? "text-red-500" : "text-gray-900"}`}>
                    {currencySymbol}{form.price || "0.00"}
                  </span>
                  {form.originalPrice && parseFloat(form.originalPrice) > parseFloat(form.price) && !priceError && (
                    <span className="text-sm text-gray-400 line-through">{currencySymbol}{form.originalPrice}</span>
                  )}
                </div>
                {form.location && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {form.location}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Product Images</h3>
              <span className="text-sm text-gray-400">{form.images.length} / {MAX_IMAGES} images (min {MIN_IMAGES})</span>
            </div>
            {form.images.length > 0 && (
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <span className="text-yellow-500">★</span> Click any image to set it as the cover photo
              </p>
            )}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {form.images.map((img, i) => (
                <div
                  key={i}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 bg-gray-100 group cursor-pointer transition-all ${
                    i === 0 ? "border-yellow-400 shadow-md shadow-yellow-100" : "border-gray-200 hover:border-blue-300"
                  }`}
                  onClick={() => {
                    if (i === 0) return
                    setForm(p => {
                      const imgs = [...p.images]
                      const [picked] = imgs.splice(i, 1)
                      imgs.unshift(picked)
                      return { ...p, images: imgs }
                    })
                  }}
                >
                  <img src={img} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 && (
                    <div className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      ★ Cover
                    </div>
                  )}
                  {i === 0 && form.flairTag && (
                    <div className={`absolute bottom-0 left-0 right-0 px-1.5 py-0.5 text-[10px] font-semibold text-center ${getFlairStyle(form.flairTag)}`}>{form.flairTag}</div>
                  )}
                  {i !== 0 && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white text-[9px] font-bold bg-black/60 px-2 py-1 rounded-full transition-opacity">Set cover</span>
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setForm(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) })) }}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {form.images.length < MAX_IMAGES && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center">
                  <Plus className="h-5 w-5 text-gray-400" />
                  <span className="text-[10px] text-gray-400 mt-1">Add</span>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-700 mb-2">Flair Tag (displays on image)</p>
              <div className="flex items-center gap-2">
                {(["OEM", "Aftermarket", "Genuine"] as FlairTag[]).map((tag) => (
                  <button key={tag!} onClick={() => setForm(p => ({ ...p, flairTag: p.flairTag === tag ? null : tag }))}
                    className={`px-3 py-1 rounded-md border text-xs font-medium transition-all ${getFlairStyle(form.flairTag === tag ? tag : null)}`}>
                    {tag}
                  </button>
                ))}
                {form.flairTag && <button onClick={() => setForm(p => ({ ...p, flairTag: null }))} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
              {[`Recommended size: 675 x 675 pixels`, `Maximum file size: 2MB per image`, `Minimum ${MIN_IMAGES} images required, maximum ${MAX_IMAGES}`].map((tip) => (
                <p key={tip} className="text-xs text-gray-400 flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500 shrink-0" />{tip}
                </p>
              ))}
            </div>
            {imageError && <div className="flex items-center gap-2 text-sm text-red-500 mt-3"><AlertCircle className="h-4 w-4" />{imageError}</div>}
          </div>

          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Brand Name</label>
                  <input type="text" placeholder="e.g. Norifumi, Apple, Nike..." value={form.brand}
                    onChange={(e) => setForm(p => ({ ...p, brand: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">{isUsedSeller ? "Part Number" : "SKU"}</label>
                    <button onClick={() => navigator.clipboard.writeText(isUsedSeller ? form.partNumber : form.sku)} className="text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600">
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                  {isUsedSeller ? (
                    <input type="text" placeholder="e.g. EXH21064" value={form.partNumber}
                      onChange={(e) => setForm(p => ({ ...p, partNumber: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  ) : (
                    <input type="text" placeholder="e.g. EXH21064" value={form.sku}
                      onChange={(e) => setForm(p => ({ ...p, sku: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Product Name</label>
                  <span className={`text-xs font-medium ${form.name.length > 180 ? "text-red-500" : "text-gray-400"}`}>
                    {form.name.length > 180 ? `${form.name.length - 180} too many` : `${180 - form.name.length} left`}
                  </span>
                </div>
                <input type="text" placeholder="e.g. NORIFUMI XPULSE 210 EXHAUST T5 BOREUP +DB KILLER" value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${form.name.length > 180 ? "border-red-400 focus:ring-red-400" : "border-gray-200"}`} />
                {form.name.length > 180 && (
                  <p className="text-xs text-red-500 mt-1 font-medium">Name exceeds 180 characters — reduce by {form.name.length - 180}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                <textarea placeholder="Describe your product in detail — material, usage, compatibility, benefits..." value={form.description}
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                <p className="text-xs text-gray-400 mt-1">Good descriptions improve search visibility and help buyers make decisions.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Search Keywords</label>
                <div className="border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 min-h-[42px] flex flex-wrap gap-1.5 items-center">
                  {form.keywords.split(",").map(k => k.trim()).filter(Boolean).map((kw, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {kw}
                      <button type="button" onClick={() => {
                        const tags = form.keywords.split(",").map(k => k.trim()).filter(Boolean)
                        tags.splice(i, 1)
                        setForm(p => ({ ...p, keywords: tags.join(", ") }))
                      }} className="hover:text-blue-900 ml-0.5">×</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault()
                        const val = keywordInput.trim().replace(/,$/, "")
                        if (!val) return
                        const existing = form.keywords.split(",").map(k => k.trim()).filter(Boolean)
                        if (!existing.includes(val)) {
                          setForm(p => ({ ...p, keywords: [...existing, val].join(", ") }))
                        }
                        setKeywordInput("")
                      } else if (e.key === "Backspace" && !keywordInput) {
                        const tags = form.keywords.split(",").map(k => k.trim()).filter(Boolean)
                        tags.pop()
                        setForm(p => ({ ...p, keywords: tags.join(", ") }))
                      }
                    }}
                    placeholder={form.keywords ? "" : "Type and press Enter…"}
                    className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add each keyword.</p>
              </div>

              {/* Type — hidden search tags */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Type <span className="text-gray-400 font-normal text-xs">(search tags — not shown to buyers)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(isUsedSeller ? ["Two Wheeler", "Four Wheeler", "Commercial", "Vintage", "Other"] : ["Two Wheeler", "Four Wheeler", "Commercial", "Vintage", "Accessories", "Other"]).map((label) => {
                    const active = form.vehicleType.includes(label)
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setForm(p => ({
                          ...p,
                          vehicleType: active
                            ? p.vehicleType.filter(v => v !== label)
                            : [...p.vehicleType, label]
                        }))}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                          active
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {!isUsedSeller && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Product Code</label>
                    <input type="text" placeholder="ISBN, UPC, etc." value={form.productCode}
                      onChange={(e) => setForm(p => ({ ...p, productCode: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
                  <div className="relative">
                    <button type="button"
                      onClick={() => { setCategoryOpen(v => !v); setCategorySearch("") }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") { setCategoryOpen(false); setCategorySearch(""); return }
                        if (e.key === "Backspace") { setCategorySearch(p => p.slice(0, -1)); return }
                        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                          setCategorySearch(p => p + e.key)
                          setCategoryOpen(true)
                        }
                      }}
                      className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm transition-all focus:outline-none bg-white ${categoryOpen ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200 hover:border-gray-300"} ${form.category ? "text-gray-900" : "text-gray-400"}`}>
                      <span>{categorySearch && categoryOpen ? <span className="text-gray-900">{categorySearch}<span className="text-gray-400">...</span></span> : (form.category || "Select Category")}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${categoryOpen ? "rotate-180" : ""}`} />
                    </button>
                    {categoryOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => { setCategoryOpen(false); setCategorySearch("") }} />
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                          <div className="max-h-44 overflow-y-auto py-1">
                            {categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-4">No results for &quot;{categorySearch}&quot;</p>
                            ) : categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).map((c) => (
                              <button key={c.id} type="button"
                                onClick={() => { setForm(p => ({ ...p, category: c.name })); setCategoryOpen(false); setCategorySearch("") }}
                                className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 ${form.category === c.name ? "text-blue-600 bg-blue-50" : "text-gray-700"}`}>
                                <span>{c.name}</span>
                                {form.category === c.name && <Check className="h-3.5 w-3.5" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">Product ID</label>
                    <button onClick={() => navigator.clipboard.writeText(form.productId)} className="text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600">
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                  <input type="text" value={form.productId} onChange={(e) => setForm(p => ({ ...p, productId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">{isUsedSeller ? "Pricing & Quantity" : "Pricing & Stock"}</h3>
            <div className="space-y-4">
              {isUsedSeller ? (
                /* Used parts seller — simplified: selling price + currency + quantity */
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Selling Price</label>
                    <input type="number" placeholder="13999" value={form.price}
                      onChange={(e) => handleSellingPriceChange(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${priceError ? "border-red-500" : "border-gray-200"}`} />
                    {priceError && <p className="text-xs text-red-500 mt-1">{priceError}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Currency</label>
                    <div className="relative">
                      <button type="button" onClick={() => setCurrencyOpen(v => !v)}
                        className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm transition-all focus:outline-none bg-white ${currencyOpen ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200 hover:border-gray-300"} text-gray-900`}>
                        <span>{form.currency === "INR" ? "INR (₹)" : form.currency === "USD" ? "USD ($)" : "EUR (€)"}</span>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${currencyOpen ? "rotate-180" : ""}`} />
                      </button>
                      {currencyOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setCurrencyOpen(false)} />
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5">
                            {[{v:"INR",l:"INR (₹)"},{v:"USD",l:"USD ($)"},{v:"EUR",l:"EUR (€)"}].map(opt => (
                              <button key={opt.v} type="button"
                                onClick={() => { setForm(p => ({ ...p, currency: opt.v })); setCurrencyOpen(false) }}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${form.currency === opt.v ? "text-blue-600 bg-blue-50" : "text-gray-700"}`}>
                                <span>{opt.l}</span>
                                {form.currency === opt.v && <Check className="h-4 w-4" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Quantity</label>
                    <input
                      type="number"
                      placeholder="1"
                      min="1"
                      step="1"
                      value={form.stock}
                      onWheel={(e) => e.currentTarget.blur()}
                      onKeyDown={(e) => { if (e.key === "." || e.key === "," || e.key === "-") e.preventDefault() }}
                      onChange={(e) => {
                        const val = e.target.value === "" ? "" : String(Math.trunc(Math.abs(Number(e.target.value))))
                        setForm(p => ({ ...p, stock: val }))
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                /* New parts seller — full pricing grid */
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Original Price (MRP)</label>
                    <input type="number" placeholder="17799" value={form.originalPrice}
                      onChange={(e) => handleOriginalPriceChange(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Offer %</label>
                    <input type="number" placeholder="21" min="0" max="100" value={form.discountPercent}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Selling Price</label>
                    <input type="number" placeholder="13999" value={form.price}
                      onChange={(e) => handleSellingPriceChange(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${priceError ? "border-red-500" : "border-gray-200"}`} />
                    {priceError && <p className="text-xs text-red-500 mt-1">{priceError}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Currency</label>
                    <div className="relative">
                      <button type="button" onClick={() => setCurrencyOpen(v => !v)}
                        className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm transition-all focus:outline-none bg-white ${currencyOpen ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200 hover:border-gray-300"} text-gray-900`}>
                        <span>{form.currency === "INR" ? "INR (₹)" : form.currency === "USD" ? "USD ($)" : "EUR (€)"}</span>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${currencyOpen ? "rotate-180" : ""}`} />
                      </button>
                      {currencyOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setCurrencyOpen(false)} />
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5">
                            {[{v:"INR",l:"INR (₹)"},{v:"USD",l:"USD ($)"},{v:"EUR",l:"EUR (€)"}].map(opt => (
                              <button key={opt.v} type="button"
                                onClick={() => { setForm(p => ({ ...p, currency: opt.v })); setCurrencyOpen(false) }}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${form.currency === opt.v ? "text-blue-600 bg-blue-50" : "text-gray-700"}`}>
                                <span>{opt.l}</span>
                                {form.currency === opt.v && <Check className="h-4 w-4" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Stock Quantity — only for new parts sellers */}
              {!isUsedSeller && <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Stock Quantity</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="120"
                      min="0"
                      step="1"
                      value={form.stock}
                      onWheel={(e) => e.currentTarget.blur()}
                      onKeyDown={(e) => {
                        if (e.key === "." || e.key === "," || e.key === "-") e.preventDefault()
                      }}
                      onChange={(e) => {
                        const raw = e.target.value
                        const val = raw === "" ? "" : String(Math.trunc(Math.abs(Number(raw))))
                        setForm(p => ({
                          ...p,
                          stock: val,
                          maxStock: maxStockManuallySet ? p.maxStock : val,
                        }))
                      }}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <div className="relative w-20">
                      <button type="button" onClick={() => setStockUnitOpen(v => !v)}
                        className={`w-full flex items-center justify-between border rounded-lg px-2 py-2 text-sm transition-all focus:outline-none bg-white ${stockUnitOpen ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200 hover:border-gray-300"} text-gray-900`}>
                        <span>{form.stockUnit}</span>
                        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${stockUnitOpen ? "rotate-180" : ""}`} />
                      </button>
                      {stockUnitOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setStockUnitOpen(false)} />
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5 min-w-[80px]">
                            {["PCS","BOX","KG","SET"].map(u => (
                              <button key={u} type="button"
                                onClick={() => { setForm(p => ({ ...p, stockUnit: u })); setStockUnitOpen(false) }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50 ${form.stockUnit === u ? "text-blue-600 bg-blue-50" : "text-gray-700"}`}>
                                <span>{u}</span>
                                {form.stockUnit === u && <Check className="h-3.5 w-3.5" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>}

              {!isUsedSeller && <><div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Min Stock <span className="text-xs text-gray-400 font-normal">(Low stock alert level)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    min="0"
                    step="1"
                    value={form.minStock}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => { if (e.key === "." || e.key === "-") e.preventDefault() }}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : String(Math.trunc(Math.abs(Number(e.target.value))))
                      setForm(p => ({ ...p, minStock: val }))
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Max Stock <span className="text-xs text-gray-400 font-normal">(Warehouse capacity)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    min="0"
                    step="1"
                    value={form.maxStock}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => { if (e.key === "." || e.key === "-") e.preventDefault() }}
                    onChange={(e) => {
                      setMaxStockManuallySet(true)
                      const val = e.target.value === "" ? "" : String(Math.trunc(Math.abs(Number(e.target.value))))
                      setForm(p => ({ ...p, maxStock: val }))
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {!maxStockManuallySet && form.maxStock && (
                    <p className="text-[10px] text-gray-400 mt-0.5">Auto-set from stock · <button type="button" className="text-blue-500 hover:underline" onClick={() => setMaxStockManuallySet(true)}>Edit</button></p>
                  )}
                </div>
              </div></> }

              <div className="flex items-center gap-8 pt-3 border-t border-gray-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm(p => ({ ...p, freeShipping: !p.freeShipping }))}
                    className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${form.freeShipping ? "bg-blue-600" : "bg-gray-200"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${form.freeShipping ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                  <span className="text-sm text-gray-700 flex items-center gap-1"><Truck className="h-4 w-4 text-green-600" /> Free Shipping</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm(p => ({ ...p, fastShipping: !p.fastShipping }))}
                    className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${form.fastShipping ? "bg-blue-600" : "bg-gray-200"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${form.fastShipping ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                  <span className="text-sm text-gray-700 flex items-center gap-1"><Zap className="h-4 w-4 text-blue-600" /> Fast Shipping</span>
                </label>
              </div>
            </div>
          </div>

          {/* ── Product Location ─────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-visible">
            {/* Header / toggle */}
            <button
              type="button"
              onClick={() => setLocationOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-blue-600" />
                <div className="text-left">
                  <h3 className="text-base font-semibold text-gray-900">Product Location</h3>
                  {!locationOpen && form.location && (
                    <p className="text-xs text-gray-400 mt-0.5">{form.location}</p>
                  )}
                </div>
              </div>
              {locationOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
            </button>

            {locationOpen && (
              <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">

                {/* ── Saved Locations — quick fill ── */}
                {savedLocations.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Saved locations — tap to fill</p>
                    <div className="flex flex-wrap gap-2" onClick={() => { if (confirmDeleteLocId) setConfirmDeleteLocId(null) }}>
                      {savedLocations.map((loc) => {
                        const isActive = form.state === loc.state && form.district === loc.district && form.pincode === loc.pincode
                        const isConfirming = confirmDeleteLocId === loc.id
                        return (
                          <div key={loc.id} className="flex items-center gap-1 group">
                            <button
                              type="button"
                              onClick={() => {
                                if (isConfirming) return
                                setForm(p => ({ ...p, state: loc.state, district: loc.district, pincode: loc.pincode, location: loc.location }))
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                                isActive
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 bg-white"
                              }`}
                            >
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              {loc.label}
                              {isActive && <Check className="h-3 w-3 ml-0.5" />}
                            </button>

                            {isConfirming ? (
                              <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
                                <span className="text-[10px] text-red-600 font-medium whitespace-nowrap">Delete?</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const updated = savedLocations.filter(l => l.id !== loc.id)
                                    setSavedLocations(updated)
                                    try { localStorage.setItem(getSavedLocationsKey(), JSON.stringify(updated)) } catch {}
                                    setConfirmDeleteLocId(null)
                                  }}
                                  className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 transition-colors px-2 py-0.5 rounded-full ml-1"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteLocId(null) }}
                                  className="text-[10px] font-medium text-gray-500 hover:text-gray-700 transition-colors px-1"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                title="Delete saved location"
                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteLocId(loc.id) }}
                                className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ── Location Fields ── */}
                <div className="space-y-3">
                  <div className="relative" ref={stateRef}>
                    <button type="button"
                      onClick={() => {
                        const rect = stateRef.current?.getBoundingClientRect() || null
                        setStateRect(rect)
                        setStateOpen(v => !v)
                        setStateSearch("")
                        setStateHighlight(-1)
                      }}
                      onKeyDown={(e) => {
                        const filtered = Object.keys(INDIA_DATA).filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()))
                        if (e.key === "Escape") { setStateOpen(false); setStateSearch(""); setStateHighlight(-1); return }
                        if (e.key === "Backspace") { e.preventDefault(); setStateSearch(p => p.slice(0, -1)); setStateHighlight(-1); return }
                        if (e.key === "ArrowDown") {
                          e.preventDefault()
                          if (!stateOpen) { setStateRect(stateRef.current?.getBoundingClientRect() || null); setStateOpen(true) }
                          setStateHighlight(p => {
                            const next = Math.min(p + 1, filtered.length - 1)
                            setTimeout(() => {
                              const el = stateListRef.current?.children[next] as HTMLElement
                              el?.scrollIntoView({ block: "nearest" })
                            }, 0)
                            return next
                          })
                          return
                        }
                        if (e.key === "ArrowUp") {
                          e.preventDefault()
                          setStateHighlight(p => {
                            const next = Math.max(p - 1, 0)
                            setTimeout(() => {
                              const el = stateListRef.current?.children[next] as HTMLElement
                              el?.scrollIntoView({ block: "nearest" })
                            }, 0)
                            return next
                          })
                          return
                        }
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (stateOpen && stateHighlight >= 0 && filtered[stateHighlight]) {
                            const s = filtered[stateHighlight]
                            setForm(p => ({ ...p, state: s, district: "", location: [s, p.pincode].filter(Boolean).join(", ") }))
                            setStateOpen(false); setStateSearch(""); setStateHighlight(-1)
                          }
                          return
                        }
                        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                          e.preventDefault()
                          setStateSearch(p => p + e.key)
                          setStateRect(stateRef.current?.getBoundingClientRect() || null)
                          setStateOpen(true)
                          setStateHighlight(0)
                        }
                      }}
                      className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm transition-all focus:outline-none bg-white ${stateOpen ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200 hover:border-gray-300"} ${form.state ? "text-gray-900" : "text-gray-400"}`}>
                      <span>
                        {stateSearch && stateOpen
                          ? <span className="text-gray-900">{stateSearch}<span className="text-gray-400">...</span></span>
                          : (form.state || "Select State / UT")}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${stateOpen ? "rotate-180" : ""}`} />
                    </button>
                    {stateOpen && stateRect && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => { setStateOpen(false); setStateSearch(""); setStateHighlight(-1) }} />
                        <div className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                          style={{ top: stateRect.bottom + 6, left: stateRect.left, width: stateRect.width }}>
                          <div ref={stateListRef} className="max-h-44 overflow-y-auto py-1">
                            {Object.keys(INDIA_DATA).filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-4">No results for &quot;{stateSearch}&quot;</p>
                            ) : Object.keys(INDIA_DATA).filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).map((s, i) => (
                              <button key={s} type="button"
                                onClick={() => { setForm(p => ({ ...p, state: s, district: "", location: [s, p.pincode].filter(Boolean).join(", ") })); setStateOpen(false); setStateSearch(""); setStateHighlight(-1) }}
                                className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors ${
                                  i === stateHighlight ? "bg-blue-600 text-white" : form.state === s ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"
                                }`}>
                                <span>{s}</span>
                                {form.state === s && i !== stateHighlight && <Check className="h-3.5 w-3.5" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="relative" ref={districtRef}>
                    <button type="button"
                      onClick={() => {
                        if (!form.state) return
                        const rect = districtRef.current?.getBoundingClientRect() || null
                        setDistrictRect(rect)
                        setDistrictOpen(v => !v)
                        setDistrictSearch("")
                        setDistrictHighlight(-1)
                      }}
                      onKeyDown={(e) => {
                        if (!form.state) return
                        const filtered = (INDIA_DATA[form.state] || []).filter(d => d.toLowerCase().includes(districtSearch.toLowerCase()))
                        if (e.key === "Escape") { setDistrictOpen(false); setDistrictSearch(""); setDistrictHighlight(-1); return }
                        if (e.key === "Backspace") { e.preventDefault(); setDistrictSearch(p => p.slice(0, -1)); setDistrictHighlight(-1); return }
                        if (e.key === "ArrowDown") {
                          e.preventDefault()
                          if (!districtOpen) { setDistrictRect(districtRef.current?.getBoundingClientRect() || null); setDistrictOpen(true) }
                          setDistrictHighlight(p => {
                            const next = Math.min(p + 1, filtered.length - 1)
                            setTimeout(() => {
                              const el = districtListRef.current?.children[next] as HTMLElement
                              el?.scrollIntoView({ block: "nearest" })
                            }, 0)
                            return next
                          })
                          return
                        }
                        if (e.key === "ArrowUp") {
                          e.preventDefault()
                          setDistrictHighlight(p => {
                            const next = Math.max(p - 1, 0)
                            setTimeout(() => {
                              const el = districtListRef.current?.children[next] as HTMLElement
                              el?.scrollIntoView({ block: "nearest" })
                            }, 0)
                            return next
                          })
                          return
                        }
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (districtOpen && districtHighlight >= 0 && filtered[districtHighlight]) {
                            const d = filtered[districtHighlight]
                            setForm(p => ({ ...p, district: d, location: [p.state, d, p.pincode].filter(Boolean).join(", ") }))
                            setDistrictOpen(false); setDistrictSearch(""); setDistrictHighlight(-1)
                          }
                          return
                        }
                        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                          e.preventDefault()
                          setDistrictSearch(p => p + e.key)
                          setDistrictRect(districtRef.current?.getBoundingClientRect() || null)
                          setDistrictOpen(true)
                          setDistrictHighlight(0)
                        }
                      }}
                      className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm transition-all focus:outline-none bg-white ${!form.state ? "opacity-50 cursor-not-allowed" : districtOpen ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200 hover:border-gray-300"} ${form.district ? "text-gray-900" : "text-gray-400"}`}>
                      <span>
                        {districtSearch && districtOpen
                          ? <span className="text-gray-900">{districtSearch}<span className="text-gray-400">...</span></span>
                          : (form.district || (form.state ? "Select District" : "Select state first"))}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${districtOpen ? "rotate-180" : ""}`} />
                    </button>
                    {districtOpen && form.state && districtRect && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => { setDistrictOpen(false); setDistrictSearch(""); setDistrictHighlight(-1) }} />
                        <div className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                          style={{ top: districtRect.bottom + 6, left: districtRect.left, width: districtRect.width }}>
                          <div ref={districtListRef} className="max-h-44 overflow-y-auto py-1">
                            {(INDIA_DATA[form.state] || []).filter(d => d.toLowerCase().includes(districtSearch.toLowerCase())).length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-4">No results for &quot;{districtSearch}&quot;</p>
                            ) : (INDIA_DATA[form.state] || []).filter(d => d.toLowerCase().includes(districtSearch.toLowerCase())).map((d, i) => (
                              <button key={d} type="button"
                                onClick={() => { setForm(p => ({ ...p, district: d, location: [p.state, d, p.pincode].filter(Boolean).join(", ") })); setDistrictOpen(false); setDistrictSearch(""); setDistrictHighlight(-1) }}
                                className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors ${
                                  i === districtHighlight ? "bg-blue-600 text-white" : form.district === d ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"
                                }`}>
                                <span>{d}</span>
                                {form.district === d && i !== districtHighlight && <Check className="h-3.5 w-3.5" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Pincode (e.g. 673001)"
                    value={form.pincode}
                    maxLength={6}
                    onKeyDown={(e) => { if (!/[0-9]|Backspace|Delete|ArrowLeft|ArrowRight|Tab/.test(e.key)) e.preventDefault() }}
                    onChange={(e) => setForm(p => ({ ...p, pincode: e.target.value, location: [p.state, p.district, e.target.value].filter(Boolean).join(", ") }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* ── Save for reuse ── only shown when fields are filled ── */}
                {(form.state || form.district || form.pincode) && (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Save this location for future products</p>
                    <p className="text-[11px] text-gray-400 mb-3">
                      Without saving, this location is only applied to this product.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder='Give it a name, e.g. "Main Shop" or "Warehouse"'
                        value={locationLabelInput}
                        onChange={(e) => setLocationLabelInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            if (!locationLabelInput.trim() || !form.state) return
                            const newLoc: SavedLocation = {
                              id: `loc-${Date.now()}`,
                              label: locationLabelInput.trim(),
                              state: form.state,
                              district: form.district,
                              pincode: form.pincode,
                              location: form.location,
                            }
                            const updated = [...savedLocations, newLoc]
                            setSavedLocations(updated)
                            try { localStorage.setItem(getSavedLocationsKey(), JSON.stringify(updated)) } catch {}
                            setLocationLabelInput("")
                            setLocationSavedFeedback(true)
                            setTimeout(() => setLocationSavedFeedback(false), 2000)
                          }
                        }}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <button
                        type="button"
                        disabled={!locationLabelInput.trim() || !form.state}
                        onClick={() => {
                          if (!locationLabelInput.trim() || !form.state) return
                          const newLoc: SavedLocation = {
                            id: `loc-${Date.now()}`,
                            label: locationLabelInput.trim(),
                            state: form.state,
                            district: form.district,
                            pincode: form.pincode,
                            location: form.location,
                          }
                          const updated = [...savedLocations, newLoc]
                          setSavedLocations(updated)
                          try { localStorage.setItem(getSavedLocationsKey(), JSON.stringify(updated)) } catch {}
                          setLocationLabelInput("")
                          setLocationSavedFeedback(true)
                          setTimeout(() => setLocationSavedFeedback(false), 2000)
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                          locationSavedFeedback
                            ? "bg-green-500 text-white"
                            : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        }`}
                      >
                        {locationSavedFeedback
                          ? <><Check className="h-4 w-4" /> Saved!</>
                          : <><Bookmark className="h-4 w-4" /> Save</>
                        }
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <label className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={specificationsOpen}
                onChange={(e) => {
                  setSpecificationsOpen(e.target.checked)
                  if (!e.target.checked) {
                    setForm(p => ({ ...p, vehicleModel: "", material: "", colour: "", year: "", weight: "", weightUnit: "kg", measurements: "", condition: "", size: "", sizeChart: "", fitment: "", warranty: "", warrantyTerms: "", includes: "" }))
                  }
                }}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">SPECIFICATIONS</h3>
                <p className="text-xs text-gray-400">Add vehicle model, year, condition and other technical details</p>
              </div>
            </label>
            {specificationsOpen && (
              <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
                {isUsedSeller ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Vehicle Model</label>
                        <input type="text" placeholder="e.g. Honda City, Royal Enfield 350" value={form.vehicleModel}
                          onChange={(e) => setForm(p => ({ ...p, vehicleModel: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Product Color</label>
                        <input type="text" placeholder="e.g. Silver" value={form.colour}
                          onChange={(e) => setForm(p => ({ ...p, colour: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Year</label>
                        <input type="text" placeholder="e.g. 2019" value={form.year}
                          onChange={(e) => setForm(p => ({ ...p, year: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Condition</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setConditionOpen(v => !v)}
                            className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm transition-all focus:outline-none ${
                              conditionOpen ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200 hover:border-gray-300"
                            } ${form.condition ? "text-gray-900" : "text-gray-400"} bg-white`}
                          >
                            <span>{form.condition || "Select Condition"}</span>
                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${conditionOpen ? "rotate-180" : ""}`} />
                          </button>
                          {conditionOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setConditionOpen(false)} />
                              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden">
                                {[
                                  { value: "New", color: "text-green-600", bg: "hover:bg-green-50" },
                                  { value: "Used - Like New", color: "text-blue-600", bg: "hover:bg-blue-50" },
                                  { value: "Used - Good", color: "text-yellow-600", bg: "hover:bg-yellow-50" },
                                  { value: "Used - Fair", color: "text-orange-600", bg: "hover:bg-orange-50" },
                                  { value: "Refurbished", color: "text-purple-600", bg: "hover:bg-purple-50" },
                                ].map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => { setForm(p => ({ ...p, condition: opt.value })); setConditionOpen(false) }}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${opt.bg} ${
                                      form.condition === opt.value ? opt.color + " bg-gray-50" : "text-gray-700"
                                    }`}
                                  >
                                    <span className={form.condition === opt.value ? opt.color : ""}>{opt.value}</span>
                                    {form.condition === opt.value && <Check className="h-4 w-4" />}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Material</label>
                        <input type="text" placeholder="e.g. Stainless Steel" value={form.material}
                          onChange={(e) => setForm(p => ({ ...p, material: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Product Color</label>
                        <input type="text" placeholder="e.g. Silver" value={form.colour}
                          onChange={(e) => setForm(p => ({ ...p, colour: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Product Weight</label>
                        <div className="flex gap-2">
                          <input type="text" placeholder="3.444" value={form.weight}
                            onChange={(e) => setForm(p => ({ ...p, weight: e.target.value }))}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <div className="relative w-16">
                            <button type="button" onClick={() => setWeightUnitOpen(v => !v)}
                              className={`w-full flex items-center justify-between border rounded-lg px-2 py-2 text-sm transition-all focus:outline-none bg-white ${weightUnitOpen ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200 hover:border-gray-300"} text-gray-900`}>
                              <span>{form.weightUnit}</span>
                              <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${weightUnitOpen ? "rotate-180" : ""}`} />
                            </button>
                            {weightUnitOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setWeightUnitOpen(false)} />
                                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5 min-w-[64px]">
                                  {["kg","g","lb"].map(u => (
                                    <button key={u} type="button"
                                      onClick={() => { setForm(p => ({ ...p, weightUnit: u })); setWeightUnitOpen(false) }}
                                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50 ${form.weightUnit === u ? "text-blue-600 bg-blue-50" : "text-gray-700"}`}>
                                      <span>{u}</span>
                                      {form.weightUnit === u && <Check className="h-3 w-3" />}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Measurements L*B*H (cm)</label>
                        <input type="text" placeholder="e.g. 45X20X10" value={form.measurements}
                          onChange={(e) => setForm(p => ({ ...p, measurements: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Fitment</label>
                    <input type="text" placeholder="e.g. Hero Xpulse 210" value={form.fitment}
                      onChange={(e) => setForm(p => ({ ...p, fitment: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Warranty Period</label>
                    <input type="text" placeholder="e.g. 6 Months, 1 Year" value={form.warranty}
                      onChange={(e) => setForm(p => ({ ...p, warranty: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Includes</label>
                  <div className="border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 min-h-[42px] flex flex-wrap gap-1.5 items-center">
                    {form.includes.split(",").map(k => k.trim()).filter(Boolean).map((item, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                        {item}
                        <button type="button" onClick={() => {
                          const tags = form.includes.split(",").map(k => k.trim()).filter(Boolean)
                          tags.splice(i, 1)
                          setForm(p => ({ ...p, includes: tags.join(", ") }))
                        }} className="hover:text-red-500 ml-0.5">×</button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={includesInput}
                      onChange={(e) => setIncludesInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault()
                          const val = includesInput.trim().replace(/,$/, "")
                          if (!val) return
                          const existing = form.includes.split(",").map(k => k.trim()).filter(Boolean)
                          if (!existing.includes(val)) {
                            setForm(p => ({ ...p, includes: [...existing, val].join(", ") }))
                          }
                          setIncludesInput("")
                        } else if (e.key === "Backspace" && !includesInput) {
                          const tags = form.includes.split(",").map(k => k.trim()).filter(Boolean)
                          tags.pop()
                          setForm(p => ({ ...p, includes: tags.join(", ") }))
                        }
                      }}
                      placeholder={form.includes ? "" : "Type and press Enter…"}
                      className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Press Enter to add each item (e.g. Exhaust, DB Killer, Mounting Kit)</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Warranty Terms & Conditions <span className="text-gray-400 font-normal">(PDF)</span></label>
                  <p className="text-xs text-gray-400 mb-2">Upload a PDF — buyers will see a clickable link on the product page</p>
                  {warrantyPdf ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <FileText className="h-5 w-5 text-red-500 shrink-0" />
                      <span className="text-sm flex-1 truncate text-gray-700">{warrantyPdf.name}</span>
                      <button
                        onClick={() => { setWarrantyPdf(null); setForm(p => ({ ...p, warrantyTerms: "" })) }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <Upload className="h-5 w-5 text-gray-400 shrink-0" />
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Click to upload PDF</span>
                        <p className="text-xs text-gray-400">Max 5MB · PDF only</p>
                      </div>
                      <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" onChange={handlePdfUpload} className="hidden" />
                    </label>
                  )}
                  {pdfError && <p className="text-xs text-red-500 mt-1">{pdfError}</p>}
                </div>

                {/* Custom Fields */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Custom Details</label>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, customFields: [...(p.customFields || []), { label: "", value: "" }] }))}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <span className="text-base leading-none">+</span> Add Field
                    </button>
                  </div>
                  {(form.customFields || []).length === 0 && (
                    <p className="text-xs text-gray-400">Add custom specs like Thread Pitch, Material Grade, Compatibility etc.</p>
                  )}
                  <div className="space-y-2">
                    {(form.customFields || []).map((field, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Label (e.g. Thread Pitch)"
                          value={field.label}
                          onChange={e => setForm(p => ({ ...p, customFields: p.customFields.map((f, idx) => idx === i ? { ...f, label: e.target.value } : f) }))}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g. M12x1.5)"
                          value={field.value}
                          onChange={e => setForm(p => ({ ...p, customFields: p.customFields.map((f, idx) => idx === i ? { ...f, value: e.target.value } : f) }))}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, customFields: p.customFields.filter((_, idx) => idx !== i) }))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Size Options — new sellers only */}
          {!isUsedSeller && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={!!form.size}
                  onChange={(e) => setForm(p => ({ ...p, size: e.target.checked ? "M:10, L:10, XL:10" : "", sizeChart: e.target.checked ? p.sizeChart : "" }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-base font-semibold text-gray-900">SIZE OPTIONS</span>
                  <p className="text-xs text-gray-400">Enable for helmets, gloves, jackets, riding gear, bearings, and any size-variant parts</p>
                </div>
              </label>
              {form.size && (
                <div className="flex-shrink-0">
                  {form.sizeChart ? (
                    <div className="relative w-16 h-16 rounded-lg border border-gray-200 overflow-hidden group">
                      <img src={form.sizeChart} alt="Size chart" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setForm(p => ({ ...p, sizeChart: "" }))}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-1 w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors justify-center">
                      <Upload className="h-4 w-4 text-gray-400" />
                      <span className="text-[9px] text-gray-400 text-center leading-tight">Size Chart</span>
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file || !file.type.startsWith("image/") || file.size > 2*1024*1024) return
                        const reader = new FileReader()
                        reader.onload = (ev) => setForm(p => ({ ...p, sizeChart: ev.target?.result as string }))
                        reader.readAsDataURL(file)
                      }} className="hidden" />
                    </label>
                  )}
                </div>
              )}
            </div>
            {form.size && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase w-24">Size</span>
                  <span className="text-xs font-semibold text-gray-500 uppercase flex-1">Stock</span>
                  <span className="w-8" />
                </div>
                {form.size.split(",").map((entry: string, idx: number) => {
                  const parts = entry.trim().split(":")
                  const sizeName = parts[0]?.trim() || ""
                  const sizeStock = parts[1]?.trim() || "0"
                  return (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <input type="text" value={sizeName} placeholder="e.g. M, XL, 6203"
                        onChange={(e) => {
                          const entries = form.size.split(",").map((s: string) => s.trim())
                          entries[idx] = `${e.target.value}:${sizeStock}`
                          setForm(p => ({ ...p, size: entries.join(", ") }))
                        }}
                        className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="number" value={sizeStock} placeholder="Stock" min="0"
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => {
                          const entries = form.size.split(",").map((s: string) => s.trim())
                          entries[idx] = `${sizeName}:${e.target.value}`
                          setForm(p => ({ ...p, size: entries.join(", ") }))
                        }}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="button"
                        onClick={() => {
                          const entries = form.size.split(",").map((s: string) => s.trim()).filter((_: string, i: number) => i !== idx)
                          setForm(p => ({ ...p, size: entries.length ? entries.join(", ") : "" }))
                        }}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
                <button type="button"
                  onClick={() => setForm(p => ({ ...p, size: p.size ? `${p.size}, :0` : ":0" }))}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 mt-2 transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Add Size
                </button>
              </div>
            )}
          </div>
          )}

          {/* Product Features — WYSIWYG Editor */}
          <FeaturesEditor
            value={form.features}
            onChange={(html) => setForm(p => ({ ...p, features: html }))}
            open={featuresOpen}
            onToggle={() => setFeaturesOpen(!featuresOpen)}
          />

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-8">
            <button
              onClick={() => {
                if (editingProduct) {
                  onCancel()
                } else {
                  resetForm()
                  document.querySelector(".overflow-auto")?.scrollTo({ top: 0, behavior: "smooth" })
                }
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 active:scale-95 active:bg-gray-100 transition-all"
            >
              {editingProduct ? "Cancel" : "Clear"}
            </button>
            <button onClick={handleSaveAsDraft} disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                draftSaved ? "border-green-500 bg-green-50 text-green-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
              {draftSaved ? <><Check className="h-4 w-4" /> Saved to Drafts!</> : <><FileStack className="h-4 w-4" /> {isSaving ? "Saving..." : "Save as Draft"}</>}
            </button>
            <button onClick={handlePublish} disabled={publishSaved}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                publishSaved ? "bg-green-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}>
              <Check className="h-4 w-4" />
              {publishSaved
                ? editingProduct && editingProduct.status === "Published" ? "Product Updated!" : "Product Added!"
                : editingProduct && editingProduct.status === "Published" ? "Update Product" : "Publish Product"
              }
            </button>
          </div>
        </>
      )}
    </div>
  )
}