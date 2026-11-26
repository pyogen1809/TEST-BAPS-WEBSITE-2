// ============================================================================
// BAPS SWAMINARAYAN SANSTHA THAILAND
// Pujya Dr. Gyanvatsal Swami Inspirational Discourse 2026
// Google Apps Script Backend (Code.gs)
//
// Automatically organizes registrations into 10 structured sheets:
// 1. Raw_Responses (Normal chronological submission order)
// 2. All_Female (All female attendees alphabetically)
// 3. All_Male (All male attendees alphabetically)
// 4. Adults_All (All adults - Primary & Additional)
// 5. Adults_Male (Adult male attendees)
// 6. Adults_Female (Adult female attendees)
// 7. Children_All (All children with Parent Name, Phone, and Registration ID)
// 8. Children_Male (Male children with Parent details and Registration ID)
// 9. Children_Female (Female children with Parent details and Registration ID)
// 10. Grouped_By_Family (Registrant as family head, with family members grouped underneath)
// ============================================================================

const EVENT_NAME = "From Burnout to Balance - Pujya Dr. Gyanvatsal Swami";
const EVENT_DATE = "Sunday, 13 December 2026 • 5:30 PM ICT";
const EVENT_VENUE = "The Tio Chew Association of Thailand, Bangkok";
const OFFICIAL_EMAIL = "baps.bangkok@gmail.com";

/**
 * 1. Custom Menu added to Google Sheets UI on open
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🕉️ BAPS Event Admin')
    .addItem('⚙️ Initialize / Format All 10 Tabs', 'setupAllTabs')
    .addItem('🔄 Refresh All Tabs from Raw_Responses', 'refreshAllTabsFromRaw')
    .addSeparator()
    .addItem('📊 View Event Attendance Statistics', 'showAttendanceStats')
    .addToUi();
}

/**
 * 2. Handles incoming POST requests from the website registration form
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const result = submitRegistration(payload);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 3. Handles GET requests (Health check and live attendance count)
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rawSheet = ss.getSheetByName("Raw_Responses");
    const count = rawSheet ? Math.max(0, rawSheet.getLastRow() - 1) : 0;
    
    const info = {
      status: "active",
      event: EVENT_NAME,
      date: EVENT_DATE,
      venue: EVENT_VENUE,
      totalAttendeesRegistered: count,
      serverTime: new Date().toISOString()
    };
    return ContentService.createTextOutput(JSON.stringify(info))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput("BAPS Bangkok Registration API is active.")
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * 4. Main Submission Logic: Saves to Raw_Responses and auto-populates all 9 specialized tabs
 */
function submitRegistration(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    setupAllTabs(ss);

    const rawSheet = ss.getSheetByName("Raw_Responses");
    const allMaleSheet = ss.getSheetByName("All_Male");
    const allFemaleSheet = ss.getSheetByName("All_Female");
    const adultsAllSheet = ss.getSheetByName("Adults_All");
    const adultsMaleSheet = ss.getSheetByName("Adults_Male");
    const adultsFemaleSheet = ss.getSheetByName("Adults_Female");
    const childrenAllSheet = ss.getSheetByName("Children_All");
    const childrenMaleSheet = ss.getSheetByName("Children_Male");
    const childrenFemaleSheet = ss.getSheetByName("Children_Female");
    const familyGroupSheet = ss.getSheetByName("Grouped_By_Family");

    const timestamp = new Date();
    const formattedTimestamp = Utilities.formatDate(timestamp, "GMT+7", "yyyy-MM-dd HH:mm:ss");

    // Generate or use unique Registration ID
    let regId = data.regId;
    if (!regId || regId.trim() === "") {
      const mmdd = Utilities.formatDate(timestamp, "GMT+7", "MMdd");
      const randNum = Math.floor(1000 + Math.random() * 9000);
      regId = "GS-" + mmdd + "-" + randNum;
    }

    const parentName = (data.parentName || "").toString().trim();
    const whatsappNumber = (data.whatsappNumber || "").toString().trim();
    const parentEmail = (data.parentEmail || "").toString().trim();
    const primaryGender = (data.primaryGender || "Male").toString().trim();

    const additionalAdults = Array.isArray(data.adults) ? data.adults : [];
    const children = Array.isArray(data.children) ? data.children : [];

    // Assemble All Attendees list
    const attendeeList = [];

    // 1. Primary Registrant (Adult 1)
    attendeeList.push({
      type: "Primary Registrant",
      name: parentName,
      gender: primaryGender,
      phone: whatsappNumber,
      email: parentEmail,
      badgeId: regId + "-A1",
      parentName: parentName,
      parentPhone: whatsappNumber,
      parentEmail: parentEmail
    });

    // 2. Additional Adults
    additionalAdults.forEach((a, idx) => {
      const aName = (a.name || "").toString().trim();
      if (!aName) return;
      attendeeList.push({
        type: "Adult Attendee",
        name: aName,
        gender: (a.gender || "Male").toString().trim(),
        phone: (a.phone || "").toString().trim(),
        email: (a.email || "").toString().trim(),
        badgeId: regId + "-A" + (idx + 2),
        parentName: parentName,
        parentPhone: whatsappNumber,
        parentEmail: parentEmail
      });
    });

    // 3. Children (12 & Under)
    children.forEach((c, idx) => {
      const cName = (c.name || "").toString().trim();
      if (!cName) return;
      attendeeList.push({
        type: "Child (12 & Under)",
        name: cName,
        gender: (c.gender || "Male").toString().trim(),
        phone: whatsappNumber,
        email: parentEmail,
        badgeId: regId + "-C" + (idx + 1),
        parentName: parentName,
        parentPhone: whatsappNumber,
        parentEmail: parentEmail
      });
    });

    // Write to Raw_Responses (Normal Entry Order)
    attendeeList.forEach(att => {
      rawSheet.appendRow([
        formattedTimestamp,
        regId,
        att.badgeId,
        att.type,
        att.name,
        att.gender,
        att.phone,
        att.email,
        parentName,
        whatsappNumber,
        parentEmail,
        regId
      ]);

      // Category-Specific Tabs:
      // A) All Male
      if (att.gender.toLowerCase() === "male" || att.gender.toLowerCase() === "boy") {
        allMaleSheet.appendRow([
          att.name,
          att.type,
          regId,
          att.badgeId,
          att.phone,
          att.email,
          parentName,
          whatsappNumber
        ]);
      }

      // B) All Female
      if (att.gender.toLowerCase() === "female" || att.gender.toLowerCase() === "girl") {
        allFemaleSheet.appendRow([
          att.name,
          att.type,
          regId,
          att.badgeId,
          att.phone,
          att.email,
          parentName,
          whatsappNumber
        ]);
      }

      // C) Adults (All, Male, Female)
      if (att.type.includes("Adult") || att.type.includes("Primary")) {
        adultsAllSheet.appendRow([
          att.name,
          att.gender,
          att.type,
          regId,
          att.badgeId,
          att.phone,
          att.email,
          parentName,
          whatsappNumber
        ]);

        if (att.gender.toLowerCase() === "male") {
          adultsMaleSheet.appendRow([
            att.name,
            att.type,
            regId,
            att.badgeId,
            att.phone,
            att.email,
            parentName,
            whatsappNumber
          ]);
        } else {
          adultsFemaleSheet.appendRow([
            att.name,
            att.type,
            regId,
            att.badgeId,
            att.phone,
            att.email,
            parentName,
            whatsappNumber
          ]);
        }
      }

      // D) Children (All, Male, Female)
      // Includes Parent Name and Registration ID as specifically requested!
      if (att.type.includes("Child")) {
        childrenAllSheet.appendRow([
          att.name,
          att.gender,
          parentName,
          whatsappNumber,
          parentEmail,
          regId,
          att.badgeId,
          formattedTimestamp
        ]);

        if (att.gender.toLowerCase() === "male" || att.gender.toLowerCase() === "boy") {
          childrenMaleSheet.appendRow([
            att.name,
            parentName,
            whatsappNumber,
            regId,
            att.badgeId,
            formattedTimestamp
          ]);
        } else {
          childrenFemaleSheet.appendRow([
            att.name,
            parentName,
            whatsappNumber,
            regId,
            att.badgeId,
            formattedTimestamp
          ]);
        }
      }
    });

    // Write to Grouped_By_Family Tab
    // Creates a bold colored Family Head row, with indented family members underneath
    const headRowIndex = familyGroupSheet.getLastRow() + 1;
    familyGroupSheet.appendRow([
      "★ FAMILY: " + parentName + " (" + attendeeList.length + " Attendees)",
      "Family Head (Primary)",
      primaryGender,
      regId + "-A1",
      whatsappNumber,
      parentEmail,
      parentName,
      regId,
      formattedTimestamp
    ]);

    // Style the Family Head row with saffron/gold accent
    familyGroupSheet.getRange(headRowIndex, 1, 1, 9)
      .setBackground("#FEF3C7")
      .setFontWeight("bold")
      .setFontColor("#92400E");

    // Write each member underneath
    attendeeList.forEach((att, i) => {
      if (i === 0) return; // Skip primary already added as head
      const isChild = att.type.includes("Child");
      const icon = isChild ? "↳ Child: " : "↳ Adult: ";
      familyGroupSheet.appendRow([
        "    " + icon + att.name,
        att.type,
        att.gender,
        att.badgeId,
        att.phone,
        att.email,
        parentName,
        regId,
        formattedTimestamp
      ]);
    });

    // Add empty spacer row after each family for visual clarity
    familyGroupSheet.appendRow(["", "", "", "", "", "", "", "", ""]);

    // Send Automated Confirmation Email (Kids Diwali Architecture)
    if (parentEmail && parentEmail.includes("@")) {
      try {
        sendConfirmationEmail({
          regId: regId,
          parentName: parentName,
          parentEmail: parentEmail,
          whatsappNumber: whatsappNumber,
          attendees: attendeeList
        });
      } catch (mailErr) {
        Logger.log("Confirmation email warning: " + mailErr.toString());
      }
    }

    return {
      success: true,
      regId: regId,
      attendeeCount: attendeeList.length,
      primaryRegistrant: parentName
    };
  } catch (err) {
    return {
      success: false,
      error: err.toString()
    };
  }
}

/**
 * 4B. Sends an automated confirmation email to the primary registrant
 * with group Pass ID, event details, and attendee badges (Kids Diwali Architecture).
 */
function sendConfirmationEmail(info) {
  const subject = "Entry Pass Confirmed: Pujya Dr. Gyanvatsal Swami Bangkok Discourse (" + info.regId + ")";

  let attendeeRowsHtml = "";
  let attendeeTextList = "";

  info.attendees.forEach(function(att, idx) {
    const roleColor = att.type.includes("Child") ? "#15803D" : (att.type.includes("Primary") ? "#92400E" : "#0369A1");
    const roleBg = att.type.includes("Child") ? "#DCFCE7" : (att.type.includes("Primary") ? "#FEF3C7" : "#E0F2FE");
    attendeeRowsHtml += `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13.5px; color: #0F172A; font-weight: 700;">
          ${idx + 1}. ${escapeHtml(att.name)}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 12px;">
          <span style="background-color: ${roleBg}; color: ${roleColor}; padding: 3px 8px; border-radius: 6px; font-weight: 700; text-transform: uppercase;">${escapeHtml(att.type)}</span>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #475569;">
          ${escapeHtml(att.gender)}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-family: monospace; font-weight: 700; color: #A94808;">
          ${escapeHtml(att.badgeId)}
        </td>
      </tr>
    `;
    attendeeTextList += `  ${idx + 1}. ${att.name} (${att.type}, ${att.gender}) - Badge ID: ${att.badgeId}\n`;
  });

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px 12px; color: #1E293B;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
        
        <!-- Header Banner (Terracotta Theme) -->
        <div style="background: #A94808; padding: 28px 24px; text-align: center; color: #FFFFFF;">
          <div style="font-size: 12px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #FED7AA; margin-bottom: 6px;">BAPS SWAMINARAYAN SANSTHA THAILAND</div>
          <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">Registration Confirmed</h1>
          <p style="margin: 0; font-size: 13.5px; color: #FFEDD5; opacity: 0.95;">Pujya Dr. Gyanvatsal Swami • Bangkok Discourse</p>
        </div>

        <div style="padding: 24px;">
          <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.6; color: #1E293B;">
            <strong>Jai Swaminarayan, ${escapeHtml(info.parentName)}!</strong>
          </p>
          <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
            Thank you for registering. Your entry pass for the inspirational discourse by <strong>Pujya Dr. Gyanvatsal Swami</strong> is confirmed. We look forward to welcoming you and your family!
          </p>

          <!-- Group Pass ID Highlight Box -->
          <div style="background-color: #FFFDF9; border: 2px dashed #A94808; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 22px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #8E3804; font-weight: 800; margin-bottom: 4px;">Group Pass ID</div>
            <div style="font-size: 24px; font-weight: 800; color: #A94808; font-family: monospace; letter-spacing: 1px;">${escapeHtml(info.regId)}</div>
            <div style="font-size: 12px; color: #78716C; margin-top: 4px;">Total Reserved: <strong>${info.attendees.length} ${info.attendees.length === 1 ? 'Seat' : 'Seats'}</strong></div>
          </div>

          <!-- Event Schedule & Venue Box -->
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 18px; margin-bottom: 22px;">
            <div style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: #0F172A; margin-bottom: 10px; letter-spacing: 0.5px;">Event Schedule &amp; Venue</div>
            <p style="margin: 5px 0; font-size: 13.5px; color: #334155;"><strong>Date:</strong> ${EVENT_DATE}</p>
            <p style="margin: 5px 0; font-size: 13.5px; color: #334155;"><strong>Venue:</strong> ${EVENT_VENUE}</p>
            <p style="margin: 5px 0; font-size: 13.5px; color: #334155;"><strong>Topic:</strong> "From Burnout to Balance"</p>
            <p style="margin: 5px 0; font-size: 13.5px; color: #334155;"><strong>Admission:</strong> Free for all registered attendees</p>
          </div>

          <!-- Registered Attendees Badges Table -->
          <div style="margin-bottom: 22px;">
            <div style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: #0F172A; margin-bottom: 10px; letter-spacing: 0.5px;">Registered Attendees &amp; Badge IDs</div>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #F1F5F9; text-align: left;">
                  <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569;">Attendee Name</th>
                  <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569;">Category</th>
                  <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569;">Gender</th>
                  <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569;">Badge ID</th>
                </tr>
              </thead>
              <tbody>
                ${attendeeRowsHtml}
              </tbody>
            </table>
          </div>

          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 12px 14px; margin-bottom: 20px; font-size: 13px; color: #065F46; line-height: 1.5;">
            💡 <strong>Check-in Notice:</strong> Please arrive by 5:15 PM and keep your Group Pass ID (${escapeHtml(info.regId)}) ready on your mobile screen or printed out for seamless entry at the welcome desk.
          </div>

          <p style="margin: 0; font-size: 12.5px; color: #64748B; line-height: 1.5;">
            For any queries or updates regarding your registration, please contact BAPS Swaminarayan Sanstha Bangkok at <a href="mailto:${OFFICIAL_EMAIL}" style="color: #A94808; font-weight: 600; text-decoration: underline;">${OFFICIAL_EMAIL}</a>.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px; text-align: center; font-size: 11.5px; color: #94A3B8;">
          Copyright © 2026 BAPS Bangkok Thailand. All Rights Reserved.<br/>
          Crafted with dedication by THE MOZZERELLA COMPANY
        </div>

      </div>
    </body>
    </html>
  `;

  const plainText = "Jai Swaminarayan, " + info.parentName + "!\n\n" +
    "Your registration for the inspirational discourse by Pujya Dr. Gyanvatsal Swami in Bangkok is confirmed.\n\n" +
    "Group Pass ID: " + info.regId + "\n" +
    "Total Seats Reserved: " + info.attendees.length + "\n" +
    "Date & Time: " + EVENT_DATE + "\n" +
    "Venue: " + EVENT_VENUE + "\n\n" +
    "Registered Attendees:\n" + attendeeTextList + "\n" +
    "Please arrive by 5:15 PM and keep this Pass ID handy at the registration desk.\n\n" +
    "Contact: " + OFFICIAL_EMAIL + "\n" +
    "BAPS Swaminarayan Sanstha Bangkok";

  MailApp.sendEmail({
    to: info.parentEmail,
    replyTo: OFFICIAL_EMAIL,
    name: "BAPS Swaminarayan Sanstha Bangkok",
    subject: subject,
    body: plainText,
    htmlBody: htmlBody
  });
}

/**
 * Escapes HTML characters for safe template rendering
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 5. One-Click Initialization & Header Formatting for all 10 Sheets
 */
function setupAllTabs(ssInstance) {
  const ss = ssInstance || SpreadsheetApp.getActiveSpreadsheet();

  const tabConfigs = [
    {
      name: "Raw_Responses",
      color: "#1E293B", // Dark Slate
      headers: [
        "Timestamp", "Registration ID", "Attendee Badge ID", "Attendee Type",
        "Attendee Name", "Gender", "Phone Number", "Email Address",
        "Primary Contact Name", "Primary Phone", "Primary Email", "Family Group ID",
        "Terms Version", "Terms Accepted", "Marketing Consent", "Photo Consent"
      ]
    },
    {
      name: "All_Male",
      color: "#0284C7", // Sky Blue
      headers: [
        "Attendee Name", "Category", "Registration ID", "Badge ID",
        "Phone Number", "Email Address", "Primary Contact Name", "Primary Phone"
      ]
    },
    {
      name: "All_Female",
      color: "#D946EF", // Fuchsia
      headers: [
        "Attendee Name", "Category", "Registration ID", "Badge ID",
        "Phone Number", "Email Address", "Primary Contact Name", "Primary Phone"
      ]
    },
    {
      name: "Adults_All",
      color: "#D97706", // Amber
      headers: [
        "Full Name", "Gender", "Role", "Registration ID", "Badge ID",
        "Phone Number", "Email Address", "Primary Contact Name", "Primary Phone"
      ]
    },
    {
      name: "Adults_Male",
      color: "#0EA5E9", // Ocean Blue
      headers: [
        "Full Name", "Role", "Registration ID", "Badge ID",
        "Phone Number", "Email Address", "Primary Contact Name", "Primary Phone"
      ]
    },
    {
      name: "Adults_Female",
      color: "#F43F5E", // Rose
      headers: [
        "Full Name", "Role", "Registration ID", "Badge ID",
        "Phone Number", "Email Address", "Primary Contact Name", "Primary Phone"
      ]
    },
    {
      name: "Children_All",
      color: "#10B981", // Emerald Green
      headers: [
        "Child Name", "Gender", "Parent Name", "Parent Phone",
        "Parent Email", "Registration ID", "Badge ID", "Registration Time"
      ]
    },
    {
      name: "Children_Male",
      color: "#06B6D4", // Cyan
      headers: [
        "Child Name", "Parent Name", "Parent Phone", "Registration ID",
        "Badge ID", "Registration Time"
      ]
    },
    {
      name: "Children_Female",
      color: "#EC4899", // Pink
      headers: [
        "Child Name", "Parent Name", "Parent Phone", "Registration ID",
        "Badge ID", "Registration Time"
      ]
    },
    {
      name: "Grouped_By_Family",
      color: "#F59E0B", // Warm Gold
      headers: [
        "Family Group Hierarchy", "Role / Relationship", "Gender", "Badge ID",
        "Phone", "Email", "Parent / Primary Contact", "Registration ID", "Timestamp"
      ]
    }
  ];

  tabConfigs.forEach(cfg => {
    let sheet = ss.getSheetByName(cfg.name);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.name);
    }

    try {
      sheet.setTabColor(cfg.color);
    } catch (e) {}

    // Setup Header Row if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(cfg.headers);
      const headerRange = sheet.getRange(1, 1, 1, cfg.headers.length);
      headerRange
        .setBackground(cfg.color)
        .setFontColor("#FFFFFF")
        .setFontWeight("bold")
        .setFontFamily("Plus Jakarta Sans")
        .setFontSize(11)
        .setVerticalAlignment("middle");
      sheet.setRowHeight(1, 38);
      sheet.setFrozenRows(1);
    }
  });
}

/**
 * 6. Admin Utility: Clears and re-syncs all 9 category tabs from Raw_Responses
 * (Useful if organizers manually edit names, correct typos, or import attendees!)
 */
function refreshAllTabsFromRaw() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawSheet = ss.getSheetByName("Raw_Responses");
  if (!rawSheet || rawSheet.getLastRow() <= 1) {
    SpreadsheetApp.getUi().alert("No registration data found in Raw_Responses.");
    return;
  }

  const rawData = rawSheet.getRange(2, 1, rawSheet.getLastRow() - 1, 12).getValues();

  // Clear existing content from target sheets (keep header row)
  const targetSheetNames = [
    "All_Male", "All_Female", "Adults_All", "Adults_Male", "Adults_Female",
    "Children_All", "Children_Male", "Children_Female", "Grouped_By_Family"
  ];

  targetSheetNames.forEach(name => {
    const s = ss.getSheetByName(name);
    if (s && s.getLastRow() > 1) {
      s.getRange(2, 1, s.getLastRow() - 1, s.getLastColumn()).clear();
    }
  });

  const allMale = [];
  const allFemale = [];
  const adultsAll = [];
  const adultsMale = [];
  const adultsFemale = [];
  const childrenAll = [];
  const childrenMale = [];
  const childrenFemale = [];
  
  // Group by Registration ID for family view
  const familyMap = {};

  rawData.forEach(row => {
    const timestamp = row[0];
    const regId = row[1];
    const badgeId = row[2];
    const type = (row[3] || "").toString().trim();
    const name = (row[4] || "").toString().trim();
    const gender = (row[5] || "Male").toString().trim();
    const phone = row[6];
    const email = row[7];
    const parentName = row[8];
    const parentPhone = row[9];
    const parentEmail = row[10];

    if (!name) return;

    const isMale = gender.toLowerCase() === "male" || gender.toLowerCase() === "boy";
    const isFemale = gender.toLowerCase() === "female" || gender.toLowerCase() === "girl";
    const isChild = type.includes("Child");
    const isAdult = type.includes("Adult") || type.includes("Primary");

    // All Male / All Female
    if (isMale) {
      allMale.push([name, type, regId, badgeId, phone, email, parentName, parentPhone]);
    } else {
      allFemale.push([name, type, regId, badgeId, phone, email, parentName, parentPhone]);
    }

    // Adults
    if (isAdult) {
      adultsAll.push([name, gender, type, regId, badgeId, phone, email, parentName, parentPhone]);
      if (isMale) {
        adultsMale.push([name, type, regId, badgeId, phone, email, parentName, parentPhone]);
      } else {
        adultsFemale.push([name, type, regId, badgeId, phone, email, parentName, parentPhone]);
      }
    }

    // Children
    if (isChild) {
      childrenAll.push([name, gender, parentName, parentPhone, parentEmail, regId, badgeId, timestamp]);
      if (isMale) {
        childrenMale.push([name, parentName, parentPhone, regId, badgeId, timestamp]);
      } else {
        childrenFemale.push([name, parentName, parentPhone, regId, badgeId, timestamp]);
      }
    }

    // Family Grouping
    if (!familyMap[regId]) {
      familyMap[regId] = {
        primaryName: parentName,
        phone: parentPhone,
        email: parentEmail,
        timestamp: timestamp,
        members: []
      };
    }
    familyMap[regId].members.push({
      name: name,
      type: type,
      gender: gender,
      badgeId: badgeId,
      phone: phone,
      email: email
    });
  });

  // Sort lists alphabetically by attendee name
  const sortByName = (a, b) => a[0].localeCompare(b[0]);
  allMale.sort(sortByName);
  allFemale.sort(sortByName);
  adultsAll.sort(sortByName);
  adultsMale.sort(sortByName);
  adultsFemale.sort(sortByName);
  childrenAll.sort(sortByName);
  childrenMale.sort(sortByName);
  childrenFemale.sort(sortByName);

  // Batch insert into respective sheets
  function insertBatch(sheetName, data) {
    if (data.length === 0) return;
    const s = ss.getSheetByName(sheetName);
    if (s) {
      s.getRange(2, 1, data.length, data[0].length).setValues(data);
    }
  }

  insertBatch("All_Male", allMale);
  insertBatch("All_Female", allFemale);
  insertBatch("Adults_All", adultsAll);
  insertBatch("Adults_Male", adultsMale);
  insertBatch("Adults_Female", adultsFemale);
  insertBatch("Children_All", childrenAll);
  insertBatch("Children_Male", childrenMale);
  insertBatch("Children_Female", childrenFemale);

  // Populate Grouped_By_Family
  const familySheet = ss.getSheetByName("Grouped_By_Family");
  if (familySheet) {
    Object.keys(familyMap).forEach(regId => {
      const fam = familyMap[regId];
      const startRow = familySheet.getLastRow() + 1;

      // Family Head Row
      familySheet.appendRow([
        "★ FAMILY: " + fam.primaryName + " (" + fam.members.length + " Attendees)",
        "Family Head (Primary)",
        fam.members[0] ? fam.members[0].gender : "Male",
        regId + "-A1",
        fam.phone,
        fam.email,
        fam.primaryName,
        regId,
        fam.timestamp
      ]);

      familySheet.getRange(startRow, 1, 1, 9)
        .setBackground("#FEF3C7")
        .setFontWeight("bold")
        .setFontColor("#92400E");

      fam.members.forEach((m, idx) => {
        if (idx === 0) return; // Skip primary already added as head
        const isChild = m.type.includes("Child");
        const icon = isChild ? "↳ Child: " : "↳ Adult: ";
        familySheet.appendRow([
          "    " + icon + m.name,
          m.type,
          m.gender,
          m.badgeId,
          m.phone,
          m.email,
          fam.primaryName,
          regId,
          fam.timestamp
        ]);
      });

      // Spacer
      familySheet.appendRow(["", "", "", "", "", "", "", "", ""]);
    });
  }

  SpreadsheetApp.getUi().alert("Success! All 9 categorized tabs have been refreshed and synchronized with Raw_Responses.");
}

/**
 * 7. Quick Attendance Overview dialog
 */
function showAttendanceStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawSheet = ss.getSheetByName("Raw_Responses");
  const maleSheet = ss.getSheetByName("All_Male");
  const femaleSheet = ss.getSheetByName("All_Female");
  const adultsSheet = ss.getSheetByName("Adults_All");
  const childrenSheet = ss.getSheetByName("Children_All");

  const total = rawSheet ? Math.max(0, rawSheet.getLastRow() - 1) : 0;
  const males = maleSheet ? Math.max(0, maleSheet.getLastRow() - 1) : 0;
  const females = femaleSheet ? Math.max(0, femaleSheet.getLastRow() - 1) : 0;
  const adults = adultsSheet ? Math.max(0, adultsSheet.getLastRow() - 1) : 0;
  const children = childrenSheet ? Math.max(0, childrenSheet.getLastRow() - 1) : 0;

  const msg = "📊 BAPS Bangkok Event Attendance Summary:\n\n" +
              "• Total Registered Attendees: " + total + "\n\n" +
              "• Total Gents (Male): " + males + "\n" +
              "• Total Ladies (Female): " + females + "\n\n" +
              "• Total Adults: " + adults + "\n" +
              "• Total Children (12 & Under): " + children + "\n\n" +
              "Venue: " + EVENT_VENUE + "\n" +
              "Date: " + EVENT_DATE;

  SpreadsheetApp.getUi().alert(msg);
}
