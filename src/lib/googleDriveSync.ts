/**
 * Solafios Mediflow - Google Drive & Google Sheets Automatic Sync Engine
 * Creates dedicated folders for relatives/family members on Google Drive,
 * and maintains synchronized medication schedules in Google Sheets.
 */

import { Medicine } from '../types/mediflow';

const MAIN_FOLDER_NAME = 'Solafios Mediflow - السجلات الطبية والعائلية';

interface DriveFileResult {
  id: string;
  name: string;
  webViewLink?: string;
}

/**
 * Searches for an existing folder or creates a new one
 */
export async function findOrCreateFolder(
  accessToken: string,
  folderName: string,
  parentId?: string
): Promise<{ id: string; webViewLink: string }> {
  let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&fields=files(id,name,webViewLink)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!listRes.ok) {
    const err = await listRes.text();
    console.warn('[DriveSync] List folder warning:', err);
  } else {
    const listData = await listRes.json();
    if (listData.files && listData.files.length > 0) {
      return {
        id: listData.files[0].id,
        webViewLink:
          listData.files[0].webViewLink || `https://drive.google.com/drive/folders/${listData.files[0].id}`,
      };
    }
  }

  // Create folder if not found
  const body: Record<string, any> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    body.parents = [parentId];
  }

  const createRes = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`فشل إنشاء المجلد في Google Drive: ${err}`);
  }

  const newFolder = await createRes.json();
  return {
    id: newFolder.id,
    webViewLink:
      newFolder.webViewLink || `https://drive.google.com/drive/folders/${newFolder.id}`,
  };
}

/**
 * Finds or creates the main app folder in root of Google Drive
 */
export async function getOrCreateMainAppFolder(
  accessToken: string
): Promise<{ id: string; webViewLink: string }> {
  return findOrCreateFolder(accessToken, MAIN_FOLDER_NAME);
}

/**
 * Creates a dedicated relative's folder inside the main Mediflow Drive folder
 */
export async function createRelativeFolder(
  accessToken: string,
  mainFolderId: string,
  relativeName: string
): Promise<{ id: string; webViewLink: string }> {
  const folderName = `سجل أدوية (${relativeName})`;
  return findOrCreateFolder(accessToken, folderName, mainFolderId);
}

/**
 * Creates or updates a Google Sheet with the relative's medications schedule
 */
export async function syncRelativeMedicinesToSheet(
  accessToken: string,
  folderId: string,
  relativeName: string,
  medicines: Medicine[]
): Promise<{ sheetId: string; sheetUrl: string }> {
  const sheetName = `جدول_أدوية_${relativeName.replace(/\s+/g, '_')}`;

  // Check if spreadsheet already exists in folder
  const query = `name = '${sheetName}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false and '${folderId}' in parents`;
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&fields=files(id,name,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  let sheetId = '';
  let sheetUrl = '';

  if (listRes.ok) {
    const data = await listRes.json();
    if (data.files && data.files.length > 0) {
      sheetId = data.files[0].id;
      sheetUrl =
        data.files[0].webViewLink || `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
    }
  }

  // Create spreadsheet if it doesn't exist
  if (!sheetId) {
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: sheetName,
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`فشل إنشاء جدول Google Sheets: ${err}`);
    }

    const created = await createRes.json();
    sheetId = created.spreadsheetId;
    sheetUrl = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

    // Move created sheet into the relative's folder
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${sheetId}?addParents=${folderId}&fields=id,parents`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  }

  // Prepare structured table data in Arabic/English
  const headerRow = [
    '#',
    'اسم الدواء (Medication)',
    'الشكل الدوائي (Type)',
    'التركيز (Strength)',
    'الجرعة (Dose)',
    'مرات الاستخدام يومياً',
    'النظام وتوقيت الوجبات',
    'مدة العلاج بالأيام',
    'الطبيب المعالج (Doctor)',
    'المستشفى أو المركز الطبي',
    'إحداثيات الموقع (GPS)',
    'موعد استشارة الطبيب القادمة',
    'تعليمات وإرشادات سريرية',
    'تاريخ الإضافة والتحديث',
  ];

  const dataRows = medicines.map((m, idx) => [
    idx + 1,
    m.name,
    m.type,
    m.strength || '-',
    m.dose,
    `${m.times_per_day}x يومياً`,
    formatScheduleLabel(m.schedule),
    `${m.duration} أيام`,
    m.doctor_name || (m.prescription_source === 'personal' ? 'استخدام شخصي' : '-'),
    m.clinic_name || '-',
    m.clinic_coordinates || '-',
    m.next_visit_time ? new Date(m.next_visit_time).toLocaleString('ar-EG') : '-',
    m.notes || '-',
    new Date(m.created_at).toLocaleDateString('ar-EG'),
  ]);

  const allValues = [headerRow, ...dataRows];

  // Update spreadsheet values
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:N${allValues.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `Sheet1!A1:N${allValues.length}`,
        majorDimension: 'ROWS',
        values: allValues,
      }),
    }
  );

  return { sheetId, sheetUrl };
}

function formatScheduleLabel(schedule: string): string {
  switch (schedule) {
    case 'before_breakfast':
      return 'قبل الإفطار';
    case 'after_breakfast':
      return 'بعد الإفطار';
    case 'before_lunch':
      return 'قبل الغداء';
    case 'after_lunch':
      return 'بعد الغداء';
    case 'before_dinner':
      return 'قبل العشاء';
    case 'after_dinner':
      return 'بعد العشاء';
    case 'before_sleep':
      return 'قبل النوم';
    case 'after_wake':
      return 'بعد الاستيقاظ';
    case 'custom_interval':
      return 'فترات متباعدة';
    default:
      return schedule;
  }
}
