const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/checklist/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add supabase import
content = content.replace(
  'import { useAuth } from "@/lib/auth";',
  'import { useAuth } from "@/lib/auth";\nimport { createClient } from "@/lib/supabase/client";'
);

// 2. Add new states inside ChecklistPage
content = content.replace(
  'const [step, setStep] = useState<1 | 2 | 3>(1);',
  `const [step, setStep] = useState<1 | 2 | 3>(1);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [uploadingPhotos, setUploadingPhotos] = useState<Record<string, boolean>>({});
  const supabase = createClient();`
);

// 3. Replace useEffect for localStorage loading
content = content.replace(
  /useEffect\(\(\) => \{\n    const storedAssets = localStorage\.getItem\("ops_gate_assets"\)[\s\S]*?\}, \[\]\);/m,
  `useEffect(() => {
    const fetchLiveData = async () => {
      const { data: assetsData } = await supabase.from("assets").select("*");
      if (assetsData && assetsData.length > 0) setAssets(assetsData as Asset[]);
      
      const { data: operatorsData } = await supabase.from("operators").select("*");
      if (operatorsData && operatorsData.length > 0) setOperators(operatorsData as Operator[]);
    };
    fetchLiveData();
  }, []);`
);

// 4. Add handlePhotoUpload
content = content.replace(
  'const handleRemarkChange = (id: string, text: string) => {\n    setRemarks((prev) => ({ ...prev, [id]: text }));\n  };',
  `const handleRemarkChange = (id: string, text: string) => {
    setRemarks((prev) => ({ ...prev, [id]: text }));
  };

  const handlePhotoUpload = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhotos(prev => ({ ...prev, [itemId]: true }));
    const fileName = \`\${Date.now()}-\${file.name}\`;
    
    const { data, error } = await supabase.storage.from("ops-media").upload(fileName, file);
    if (!error && data) {
      const { data: urlData } = supabase.storage.from("ops-media").getPublicUrl(fileName);
      setPhotoUrls(prev => ({ ...prev, [itemId]: urlData.publicUrl }));
    } else {
      alert("Failed to upload photo. Please try again.");
    }
    setUploadingPhotos(prev => ({ ...prev, [itemId]: false }));
  };`
);

// 5. Update allAnswered
content = content.replace(
  /const allAnswered = useMemo\(\(\) => \{\n    return currentItems\.every\(\(item\) => answers\[item\.id\] !== undefined\);\n  \}, \[currentItems, answers\]\);/m,
  `const allAnswered = useMemo(() => {
    return currentItems.every((item) => {
      const ans = answers[item.id];
      if (ans === undefined) return false;
      if (ans === "N" || ans === "R" || ans === "M") {
        return !!photoUrls[item.id] && !!remarks[item.id];
      }
      return true;
    });
  }, [currentItems, answers, photoUrls, remarks]);`
);

// 6. Replace Render chunk for remarks
content = content.replace(
  /\{\/\* Defect Remarks tied directly to line number \*\/\}[\s\S]*?<\/div>\n                        \)\}/m,
  `{/* Defect Remarks and Photo tied directly to line number */}
                        {(ans === "N" || ans === "R" || ans === "M") && (
                          <div className="animate-slide-down space-y-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                            <input
                              type="text"
                              required
                              value={remarks[item.id] || ""}
                              onChange={(e) => handleRemarkChange(item.id, e.target.value)}
                              placeholder="🚨 REQUIRED: Describe the failure details..."
                              className="w-full px-3 py-2 text-xs border border-rose-200 text-rose-900 rounded-lg placeholder-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                            />
                            
                            <div className="flex items-center gap-3">
                              <label className="cursor-pointer bg-white border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-2">
                                📷 {uploadingPhotos[item.id] ? "Uploading..." : "Take Photo (Required)"}
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  capture="environment" 
                                  className="hidden" 
                                  onChange={(e) => handlePhotoUpload(item.id, e)} 
                                  disabled={uploadingPhotos[item.id]}
                                />
                              </label>
                              
                              {photoUrls[item.id] && (
                                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                                  ✓ Photo attached
                                </span>
                              )}
                            </div>
                          </div>
                        )}`
);

// 7. Update handleFinalSubmit signature
content = content.replace(
  'const handleFinalSubmit = () => {',
  'const handleFinalSubmit = async () => {'
);

// 8. Replace handleFinalSubmit body for saving logic
content = content.replace(
  /if \(isSimulateOffline\) \{[\s\S]*?\}\n\n    setFinalRecord\(newRecord\);/m,
  `// Save to Supabase DB instead of localStorage
    const eventPayload = {
      asset_id: selectedAsset.id,
      operator_id: selectedOperator.id,
      event_type: "pre_start_checklist",
      checklist_result: isDispatchBlocked ? "fail" : "pass",
      odometer_or_hours: newRecord.odometer_or_hours,
      notes: overrideReason,
      photo_urls: Object.values(photoUrls),
      flagged_components: defects.map(d => d.item_label)
    };

    const { data: eventData, error: eventError } = await supabase.from("events").insert(eventPayload).select().single();

    if (eventData) {
      if (defects.length > 0) {
        const defectInserts = defects.map(d => ({
          event_id: eventData.id,
          asset_id: selectedAsset.id,
          item_label: d.item_label,
          description: d.description,
          photo_url: photoUrls[d.item_id],
          status: "open"
        }));
        await supabase.from("defects").insert(defectInserts);
      }

      if (newRecord.status === "rejected") {
        await supabase.from("assets").update({ status: "blocked" }).eq("id", selectedAsset.id);
      } else {
        await supabase.from("assets").update({ status: "in_service" }).eq("id", selectedAsset.id);
      }
    } else {
      console.error("Failed to insert event", eventError);
    }

    setFinalRecord(newRecord);`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully refactored app/checklist/page.tsx');
