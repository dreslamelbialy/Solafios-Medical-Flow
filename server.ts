import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Support large image payloads (up to 25MB for high-res prescription photos)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Google GenAI client
const geminiApiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('[Server] Could not initialize GoogleGenAI:', err);
  }
}

/**
 * High-accuracy clinical fallback presets for offline/conference demos
 * Includes Dr. Moaz Ateto (Ophthalmology) from real prescription photo
 */
const CLINICAL_DEMO_PRESETS = [
  {
    doctorName: 'د. معاذ عطيتو (طبيب وجراح العيون والمياه البيضاء والليزر)',
    clinicName: 'عيادة د. معاذ عطيتو لجراحة العيون - جامعة الأزهر',
    clinicLocation: 'الأقصر - البياضية بجوار كمين القرنة - أعلى صيدلية د. طارق الجديدة (01029914596)',
    clinicCoordinates: '25.6872, 32.6396',
    patientName: 'أحمد سيف',
    patientAge: '16 سنة',
    visitDate: '2024-11-24',
    nextVisitDate: '2024-12-01',
    diagnosis: 'فحص عيون ومتابعة حساسية وجفاف مع التهاب سطحي',
    medicines: [
      {
        name: 'قطرة مرطبة للعين (Lubricant Eye Drops E.D.)',
        strength: '15ml',
        dose: 'قطرة بالعين',
        pills_per_dose: 1,
        times_per_day: 3,
        schedule: 'custom_interval',
        duration: 14,
        notes: 'قطرة 3 مرات يومياً لمدة أسبوعين لترطيب العين ومنع الجفاف',
        type: 'drops',
      },
      {
        name: 'مسكن ومضاد للالتهاب (Analgesic Drug TAB.)',
        strength: '500mg',
        dose: 'قرص واحد',
        pills_per_dose: 1,
        times_per_day: 2,
        schedule: 'after_lunch',
        duration: 7,
        notes: 'قرص بعد الأكل مرتين يومياً لمدة أسبوع "ولا يكرر"',
        type: 'tablet',
      },
      {
        name: 'مرهم مضاد حيوي للعين (Antibiotic Eye Ointment E.O.)',
        strength: '5g',
        dose: 'مرهم داخل الجفن',
        pills_per_dose: 1,
        times_per_day: 1,
        schedule: 'before_sleep',
        duration: 7,
        notes: 'يوضع داخل جفن العين مساءً قبل النوم لمدة أسبوع',
        type: 'cream',
      },
    ],
  },
  {
    doctorName: 'د. مجدي يعقوب (استشاري أمراض الباطنة والقلب)',
    clinicName: 'مركز أسوان لجراحة وأمراض القلب والباطنة',
    clinicLocation: 'أسوان - كورنيش النيل',
    clinicCoordinates: '24.0889, 32.8998',
    patientName: 'أحمد محمود',
    patientAge: '45 سنة',
    visitDate: '2026-10-07',
    nextVisitDate: '2026-10-21',
    diagnosis: 'التهاب حاد في المعدة مع صداع وإجهاد عام',
    medicines: [
      {
        name: 'أوميبرازول (Omeprazole)',
        strength: '20mg',
        dose: 'كبسولة واحدة',
        pills_per_dose: 1,
        times_per_day: 1,
        schedule: 'before_breakfast',
        duration: 14,
        notes: 'تؤخذ صباحاً على الريق قبل وجبة الإفطار بنصف ساعة',
        type: 'tablet',
      },
      {
        name: 'بانادول إكسترا (Panadol Extra)',
        strength: '500mg',
        dose: 'قرص واحد',
        pills_per_dose: 1,
        times_per_day: 3,
        schedule: 'after_lunch',
        duration: 5,
        notes: 'يؤخذ بعد الأكل لتسكين الألم والصداع عند اللزوم',
        type: 'tablet',
      },
      {
        name: 'فيتامين ب المركب (Neurobion)',
        strength: 'B1/B6/B12',
        dose: 'قرص واحد',
        pills_per_dose: 1,
        times_per_day: 1,
        schedule: 'after_breakfast',
        duration: 30,
        notes: 'مكمل مقوي للأعصاب مع وجبة الإفطار',
        type: 'tablet',
      },
    ],
  },
  {
    doctorName: 'د. حسام حسني (أستاذ الأمراض الصدرية)',
    clinicName: 'مستشفى الصدر والعيادات التخصصية',
    clinicLocation: 'القاهرة - مدينة نصر',
    clinicCoordinates: '30.0561, 31.3301',
    patientName: 'فاطمة الزهراء',
    patientAge: '28 سنة',
    visitDate: '2026-10-07',
    nextVisitDate: '2026-10-14',
    diagnosis: 'التهاب الشعب الهوائية مع كحة وسعال حاد',
    medicines: [
      {
        name: 'أوجمنتين (Augmentin)',
        strength: '1g',
        dose: 'قرص واحد',
        pills_per_dose: 1,
        times_per_day: 2,
        schedule: 'custom_interval',
        duration: 7,
        notes: 'مضاد حيوي كل 12 ساعة بانتظام لإتمام الكورس بالكامل',
        type: 'tablet',
      },
      {
        name: 'برونكوتيك شراب (Bronchotec Syrup)',
        strength: '100ml',
        dose: '10 مل (ملعقة كبيرة)',
        pills_per_dose: 1,
        times_per_day: 3,
        schedule: 'after_dinner',
        duration: 7,
        notes: 'مهدئ وموسع للشعب الهوائية ثلاث مرات يومياً بعد الأكل',
        type: 'syrup',
      },
      {
        name: 'فيتامين سي زنك (C-Retard Zinc)',
        strength: '500mg',
        dose: 'كبسولة واحدة',
        pills_per_dose: 1,
        times_per_day: 1,
        schedule: 'after_lunch',
        duration: 10,
        notes: 'لدعم الجهاز المناعي ومقاومة العدوى',
        type: 'tablet',
      },
    ],
  },
];

/**
 * POST /api/scan-prescription
 * High-reliability clinical vision endpoint using fast Gemini models
 */
app.post('/api/scan-prescription', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', language = 'ar', presetIndex } = req.body;

    // Fast-path: User selected a conference live demo preset
    if (presetIndex !== undefined && CLINICAL_DEMO_PRESETS[presetIndex]) {
      const preset = CLINICAL_DEMO_PRESETS[presetIndex];
      res.json({
        success: true,
        source: 'clinical_demo_preset',
        doctorName: preset.doctorName,
        clinicName: preset.clinicName,
        clinicLocation: preset.clinicLocation,
        clinicCoordinates: preset.clinicCoordinates,
        patientName: preset.patientName,
        patientAge: preset.patientAge,
        visitDate: preset.visitDate,
        nextVisitDate: preset.nextVisitDate,
        diagnosis: preset.diagnosis,
        medicines: preset.medicines,
      });
      return;
    }

    // If no image is provided
    if (!imageBase64) {
      res.status(400).json({
        success: false,
        error: 'No image data provided for scanning.',
      });
      return;
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    // If Gemini client is available, call fast models
    if (ai) {
      const prompt = `You are an expert clinical medical pharmacist and prescription reader assistant.
Analyze this prescription image thoroughly.
Extract all medications, doctor details, patient details, clinic location/address, dosage instructions, frequency, and relations to meals.
Decipher handwriting, medical Latin abbreviations (e.g. b.i.d = twice daily, t.i.d = 3 times daily, q.d = once daily, q8h = every 8 hours, p.c = after meals, a.c = before meals, hs = bedtime, E.D. = Eye Drops, E.O. = Eye Ointment, TAB = Tablet).

Return a valid JSON object matching this structure:
{
  "doctorName": "Doctor full name and specialization if visible",
  "clinicName": "Clinic or hospital name if visible",
  "clinicLocation": "Clinic address or phone if visible",
  "patientName": "Patient name if visible",
  "patientAge": "Patient age if visible e.g. 16",
  "visitDate": "Date of prescription if visible (YYYY-MM-DD)",
  "diagnosis": "Diagnosis or brief indication if visible",
  "medicines": [
    {
      "name": "Trade or scientific medication name",
      "strength": "e.g. 500mg or 20mg or 15ml",
      "dose": "Dose description in Arabic or English e.g. قرص واحد, قطرة, مرهم",
      "pills_per_dose": 1,
      "times_per_day": 2,
      "schedule": "One of: before_breakfast, after_breakfast, before_lunch, after_lunch, before_dinner, after_dinner, before_sleep, after_wake, custom_interval",
      "duration": 7,
      "notes": "Clear instructions on how and when to take with meals or water",
      "type": "One of: tablet, syrup, injection, drops, cream, inhaler"
    }
  ]
}

Important:
- Provide values in Arabic when suitable for the patient.
- Ensure schedule matches one of the valid enum values: before_breakfast, after_breakfast, before_lunch, after_lunch, before_dinner, after_dinner, before_sleep, after_wake, custom_interval.
- Ensure type is one of: tablet, syrup, injection, drops, cream, inhaler.
- Only return JSON, no markdown formatting.`;

      // Try fast models in order: gemini-flash-latest, then gemini-3.1-flash-lite
      const modelsToTry = ['gemini-flash-latest', 'gemini-3.1-flash-lite'];

      for (const modelName of modelsToTry) {
        try {
          console.log(`[Server] Attempting vision scan with model: ${modelName}`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType || 'image/jpeg',
                      data: cleanBase64,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            config: {
              httpOptions: { timeout: 45000 },
            },
          });

          const rawText = (response.text || '').trim();
          let parsedData: any = null;

          // Attempt robust JSON extraction
          try {
            parsedData = JSON.parse(rawText);
          } catch {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                parsedData = JSON.parse(jsonMatch[0]);
              } catch (e2) {
                console.warn(`[Server] Regex JSON parse error:`, e2);
              }
            }
          }

          if (parsedData && Array.isArray(parsedData.medicines) && parsedData.medicines.length > 0) {
            console.log(`[Server] Successfully parsed prescription via ${modelName}! Medicines found: ${parsedData.medicines.length}`);
            res.json({
              success: true,
              source: modelName,
              doctorName: parsedData.doctorName || '',
              clinicName: parsedData.clinicName || '',
              clinicLocation: parsedData.clinicLocation || '',
              patientName: parsedData.patientName || '',
              patientAge: parsedData.patientAge ? String(parsedData.patientAge) : '',
              visitDate: parsedData.visitDate || '',
              diagnosis: parsedData.diagnosis || '',
              medicines: parsedData.medicines.map((m: Record<string, unknown>, idx: number) => ({
                id: `extracted-${Date.now()}-${idx}`,
                name: String(m.name || 'دواء موصوف'),
                strength: String(m.strength || ''),
                dose: String(m.dose || 'قرص واحد'),
                pills_per_dose: Number(m.pills_per_dose) || 1,
                times_per_day: Number(m.times_per_day) || 2,
                schedule: String(m.schedule || 'custom_interval'),
                duration: Number(m.duration) || 7,
                notes: String(m.notes || ''),
                type: String(m.type || 'tablet'),
              })),
            });
            return;
          }
        } catch (modelErr: any) {
          console.warn(`[Server] Model ${modelName} failed or timed out:`, modelErr?.message || modelErr);
          // Loop to next model
        }
      }
    }

    // If we reach here, vision models did not extract medicines from user photo
    res.status(422).json({
      success: false,
      error: 'لم نتمكن من قراءة أسماء الأدوية بوضوح من الصورة المرفقة. يرجى التأكد من وضوح إضاءة الروشتة وزاوية التصوير، أو إدخال الأدوية يدوياً عبر تبويب "إضافة دواء"، أو تجربة النماذج المعتمدة للمؤتمر.',
    });
  } catch (error: unknown) {
    console.error('[Server] Unexpected scan endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ أثناء معالجة الصورة. يرجى إعادة المحاولة أو إدخال الدواء يدوياً.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Solafios Mediflow server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
