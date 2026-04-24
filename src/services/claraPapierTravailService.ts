/**
 * Clara Papier Travail Service
 * 
 * Specialized service for processing audit workpapers (Papiers de Travail)
 * from n8n responses and transforming them into specialized UI components.
 */

export class ClaraPapierTravailService {
  /**
   * Detects if the data is a "Papier de travail" (audit workpaper)
   */
  public detectPapierTravail(data: any): boolean {
    if (!data) return false;

    const natureKeywords = ["nature de test", "nature_de_test", "nature de Test"];
    
    // Check all keys and sub-objects recursively (shallow)
    const checkObj = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      
      // Check direct keys
      for (const k of Object.keys(obj)) {
        if (natureKeywords.some(kw => k.toLowerCase() === kw)) return true;
        
        // Check if value is a table with that key
        if (typeof obj[k] === 'object' && obj[k] !== null) {
          const sub = obj[k];
          if (Array.isArray(sub)) {
            if (sub.some(item => natureKeywords.some(kw => Object.keys(item).some(ik => ik.toLowerCase().includes(kw))))) return true;
          } else {
            if (natureKeywords.some(kw => Object.keys(sub).some(sk => sk.toLowerCase().includes(kw)))) return true;
          }
        }
      }
      return false;
    };

    if (checkObj(data)) return true;

    // Check specific known structures
    for (const key in data) {
      if (key.toLowerCase().includes("etape") || key.toLowerCase().includes("feuille")) {
        if (checkObj(data[key])) return true;
        if (Array.isArray(data[key])) {
          if (data[key].some((item: any) => checkObj(item))) return true;
        }
      }
    }

    return false;
  }

  /**
   * Processes the data to generate the audit workpaper HTML/Markdown
   */
  public process(data: any): string {
    let html = `
      <style>
        .clara-papier-travail { font-family: 'Inter', sans-serif; color: #333; }
        .clara-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.9em; }
        .clara-table th, .clara-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .clara-table th { background-color: #f8f9fa; font-weight: 600; }
        .section-bar { background: #1855A3; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 6px 12px; margin-bottom: 0; border-radius: 4px 4px 0 0; }
        /* ── Schéma de calcul row (inside thead of main test table) ── */
        .schema-calcul-row td {
          padding: 3px 6px;
          font-weight: 700;
          font-size: 0.82em;
          text-align: center;
          white-space: nowrap;
          border: none;
        }
        .schema-calcul-row td.ltr  { background: #EFF6FF; color: #1855A3; border: 0.5px solid #94a3b8 !important; }
        .schema-calcul-row td.ltr-e { background: #FFF7ED; color: #9a3412; border: 0.5px solid #94a3b8 !important; }
        .schema-calcul-row td.nb   { background: transparent; border: none !important; }
        /* ── Totalization & cross-ref rows ── */
        .total-row { background-color: #dcfce7; font-weight: bold; color: #166534; }
        .cross-ref-h-row td { color: #0056b3; font-style: italic; font-size: 0.85em; text-align: center; }
        /* Visibility states */
        .total-row.hidden       { display: none; }
        .cross-ref-h-row.hidden { display: none; }
        .col-x-ref-v.hidden     { display: none; }
        /* Interactive columns */
        .col-assertion, .col-conclusion, .col-ctr { cursor: pointer; background-color: #fdfdfe; }
        .col-assertion:hover, .col-conclusion:hover, .col-ctr:hover { background-color: #f0f7ff; }
        /* Misc */
        .signature-table td:first-child { font-weight: bold; width: 30%; }
        .objectives-table td { background-color: #fff9db; }
        .legends-table { width: auto; min-width: 300px; }
        .test-table-container { overflow-x: auto; }
      </style>
      <div class="clara-papier-travail">
    `;
    
    try {
      // 1. Signature Worksheet (Table 0)
      html += this.renderSignatureWorksheet(data);

      // 2. Mission Info (Table 1)
      html += this.renderMissionInfo(data);

      // 3. Objectives (Table 2)
      html += `
        <div class="worksheet-section objectives-section">
          <div class="section-bar">Objectifs du test</div>
          <table class="clara-table">
            <tbody><tr><td>${this.getObjectivesText(data)}</td></tr></tbody>
          </table>
        </div>
      `;

      // 4. Tasks (Table 3)
      html += this.renderTasks(data);

      // 5. Main Test Section
      html += this.renderTestSection(data);

      // 6. Legends (Table 9)
      html += this.renderLegends(data);

      // 7. Manager Review (Table 10)
      html += this.renderManagerReview(data);

      // 8. Documentary Cross References (Table 8)
      html += this.renderDocumentaryCrossRefs(data);

    } catch (error) {
      console.error("Error processing Papier de Travail:", error);
      return `<div class="error">Erreur lors du traitement du Papier de Travail: ${error}</div>`;
    }

    html += '</div>';
    return html;
  }

  private renderSignatureWorksheet(data: any): string {
    const table0 = this.findTable(data, ["table 0", "signature worksheet", "Signature worksheet"]);
    if (!table0) return "";

    const item = Array.isArray(table0) ? table0[0] : table0;
    return `
      <div class="worksheet-section signature-worksheet">
        <div class="section-bar">Signature Worksheet</div>
        <table class="clara-table signature-table" style="width: 400px;">
          <tbody>
            ${Object.entries(item).map(([key, value]) => `<tr><td class="lbl">${key}</td><td>${value}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderMissionInfo(data: any): string {
    const table1 = this.findTable(data, ["table 1"]);
    if (!table1) return "";

    const item = { ...(Array.isArray(table1) ? table1[0] : table1) };
    const nature = this.getNatureDeTest(data);
    if (nature && !item["Nature de test"]) item["Nature de test"] = nature;

    return `
      <div class="worksheet-section mission-info">
        <div class="section-bar">Feuille de couverture</div>
        <table class="clara-table">
          <tbody>
            ${Object.entries(item).map(([k, v]) => `<tr><td class="lbl">${k}</td><td>${v}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderObjectives(data: any): string {
    const table2 = this.findTable(data, ["table 2", "objectifs", "OBJECTIFS"]);
    if (!table2) return "";

    const item = Array.isArray(table2) ? table2[0] : table2;
    return `
      <div class="worksheet-section objectives-section">
        <table class="clara-table objectives-table">
          <thead><tr><th>🎯 OBJECTIFS DU TEST</th></tr></thead>
          <tbody>
            <tr><td>${item["OBJECTIFS"] || item["objectifs"] || Object.values(item)[0]}</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  private renderTasks(data: any): string {
    const table3 = this.findTable(data, ["table 3", "travaux", "travaux a effectuer"]);
    if (!table3 || !Array.isArray(table3)) return "";

    return `
      <div class="worksheet-section tasks-section">
        <div class="section-bar">Procédures / Travaux à effectuer</div>
        <table class="clara-table tasks-table">
          <thead>
            <tr><th style="width:40px;">no</th><th>Description</th></tr>
          </thead>
          <tbody>
            ${table3.map((row: any) => `
              <tr>
                <td>${row.no || row.No || ''}</td>
                <td>${row["travaux a effectuer"] || row["travaux"] || Object.values(row)[1] || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderTestSection(data: any): string {
    const table5 = this.findTable(data, ["table 5", "modelised table", "Modelized Table"]);
    if (!table5 || !Array.isArray(table5)) return "";

    const nature = this.getNatureDeTest(data);
    const schemaCalcul = this.findTable(data, ["table 4b", "schema de calcul", "Schéma de calcul"]);
    const totalisationData = this.findTable(data, ["table 6", "totalisation", "Totalisation"]);
    const crossRefHData = this.findTable(data, ["table 7", "cross references horizontale"]);

    // Main Table Headers
    const headers = Object.keys(table5[0]);

    // Generate the schema row HTML (a single <tr> injected into <thead>)
    // By placing it inside the same <table>, column widths align automatically.
    const schemaRow = this.generateSchemaRow(nature, schemaCalcul, headers);

    return `
      <div class="worksheet-section test-section">
        <div class="section-bar">Schéma de calcul</div>
        <div class="test-table-container">
          <table class="clara-table main-test-table" id="main-test-table">
            <thead>
              ${schemaRow}
              <tr>
                ${headers.map(h => `<th class="${this.getCellClass(h)}">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${table5.map(row => `
                <tr>
                  ${headers.map(h => `<td class="${this.getCellClass(h)}" data-header="${h}">${row[h] || ''}</td>`).join('')}
                </tr>
              `).join('')}
              ${this.renderTotalizationRow(headers, totalisationData, table5)}
              ${this.renderCrossRefHRow(headers, crossRefHData)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * Generates a single schema <tr> row injected as the FIRST row of <thead>
   * in the main test table. This guarantees perfect column alignment without
   * any JavaScript width-sync or separate table tricks.
   * Returns empty string if no schema applies.
   */
  private generateSchemaRow(nature: string, schemaData: any, headers: string[]): string {
    let models: string[] = [];
    const n = nature ? nature.toLowerCase() : "";

    // ── Build models array based on "Nature de test" ──────────────────
    if (n.includes("validation")) {
      models = ["(A)", "(B)", "(C) = (A)+(B)"];
    } else if (n.includes("mouvement")) {
      models = ["(A)", "(B)", "(C)", "(D) = (A+B-C)", "(E)", "(F) = (D)-(E)"];
    } else if (n.includes("rapprochement")) {
      models = ["(A)", "(B)", "(C) = (A) - (B)"];
    } else if (n.includes("separation")) {
      models = ["(A)", "(B)", "(C) = (A) - (B)"];
    } else if (n.includes("estimation")) {
      models = ["A", "B", "C = A*B", "D", "E = C - D"];
    } else if (n.includes("revue analytique")) {
      models = ["(A)", "(B)", "(C) = (A) - (B)"];
    } else if (n.includes("cadrage tva")) {
      models = ["(A)", "(B) = (A)*18%", "(C)", "(D)", "(E)", "(F) = (B) - (C) - (D) - (E)"];
    } else if (n.includes("cotisations sociales")) {
      // User left it empty in prompt, fallback will handle if rawSchema exists, but let's provide a generic default if empty
      models = ["(A)", "(B)", "(C) = (A) - (B)"];
    } else if (n !== "") {
      // REGEX FALLBACK — Modelisation variable or unknown nature:
      // Extract groups like (X), (Z) = (X) - (Y), (Z) = (T) + (X) - (Y)
      const rawSchema = schemaData
        ? (Array.isArray(schemaData)
            ? (schemaData[0]["Sch\u00e9ma de calcul"] || schemaData[0][Object.keys(schemaData[0])[0]])
            : (schemaData["Sch\u00e9ma de calcul"] || Object.values(schemaData)[0]))
        : "";
      
      let rawStr = String(rawSchema).trim();
      if (rawStr) {
        // If explicit separators are used
        if (rawStr.includes(';') || rawStr.includes('|')) {
          models = rawStr.split(/\s*[;|]\s*/).map((s: string) => s.trim()).filter(Boolean);
        } else {
          // Advanced regex to extract variables and their formulas
          // Matches: (Letter) followed by text, optionally followed by '=' and its formula, until the next variable starts
          const rx = /(?:\([A-Z]\)[^=;()]*?(?:=[^;]*)?(?=\s*\([A-Z]\)[^=;()]*?(?:=|$)|$))/g;
          const found = rawStr.match(rx);
          models = found ? found.map((s: string) => s.trim()) : [rawStr];
        }
      }
    }

    if (models.length === 0) return "";

    // ── Anchor: the FIRST "Ecart" column (regex, case-insensitive) ────
    // The last model label sits AT the Ecart column (that column IS the
    // computed value in the JSON response, e.g. C = A - B).
    const ecartIndex = headers.findIndex(h => /^[e\u00e9]cart/i.test(h.trim()));
    const anchorIndex = ecartIndex !== -1 ? ecartIndex : headers.length - 1;

    // Fill row cells right-to-left ending at anchorIndex
    const rowCells: string[] = new Array(headers.length).fill("");
    for (let i = 0; i < models.length; i++) {
      const targetIndex = anchorIndex - (models.length - 1 - i);
      if (targetIndex >= 0 && targetIndex < headers.length) {
        rowCells[targetIndex] = models[i].trim();
      }
    }

    // ── Render as a <tr class="schema-calcul-row"> inside <thead> ─────
    // CSS class ltr   = blue  (formula variables A, B, C…)
    // CSS class ltr-e = orange (the Ecart / result formula cell)
    // CSS class nb    = transparent (empty cells)
    const cells = rowCells.map((cell, idx) => {
      let cls = 'nb';
      if (cell) {
        // The cell at anchorIndex is the Ecart result → orange
        cls = (idx === anchorIndex) ? 'ltr-e' : 'ltr';
      }
      return `<td class="${cls}">${cell}</td>`;
    }).join('');

    return `<tr class="schema-calcul-row">${cells}</tr>`;
  }

  private renderTotalizationRow(headers: string[], totalisationData: any, table5: any[]): string {
    // If we have explicit totalization data from JSON, use it
    if (totalisationData) {
      const totalRow = Array.isArray(totalisationData) ? totalisationData[0] : totalisationData;
      return `
        <tr class="total-row">
          ${headers.map(h => `<td>${totalRow[h] || ''}</td>`).join('')}
        </tr>
      `;
    }

    // Otherwise, perform automatic totalization for monetary columns
    const totals: { [key: string]: number } = {};
    headers.forEach(h => {
      if (this.isMonetaryHeader(h)) {
        totals[h] = table5.reduce((sum, row) => {
          const val = parseFloat(String(row[h] || "0").replace(/\s/g, '').replace(',', '.'));
          return sum + (isNaN(val) ? 0 : val);
        }, 0);
      }
    });

    return `
      <tr class="total-row">
        ${headers.map(h => {
          if (h.toLowerCase().includes("no") || h.toLowerCase().includes("n°")) return '<td>Total</td>';
          if (totals[h] !== undefined) return `<td>${totals[h].toLocaleString('fr-FR')}</td>`;
          return '<td></td>';
        }).join('')}
      </tr>
    `;
  }

  private renderCrossRefHRow(headers: string[], crossRefData: any): string {
    if (!crossRefData) return "";
    const items = Array.isArray(crossRefData) ? crossRefData : [crossRefData];
    
    return items.map(item => `
      <tr class="cross-ref-h-row">
        ${headers.map(h => {
          const val = item[h] || "";
          return `<td>${val ? `<span class="cross">${val}</span>` : ""}</td>`;
        }).join('')}
      </tr>
    `).join('');
  }

  private getObjectivesText(data: any): string {
    const table2 = this.findTable(data, ["table 2", "objectifs"]);
    if (!table2) return "";
    const item = Array.isArray(table2) ? table2[0] : table2;
    return item["OBJECTIFS"] || item["objectifs"] || Object.values(item)[0];
  }

  private renderLegends(data: any): string {
    const table9 = this.findTable(data, ["table 9", "legendes", "Légendes"]);
    if (!table9 || !Array.isArray(table9)) return "";

    return `
      <div class="worksheet-section legends-section">
        <table class="clara-table legends-table">
          <thead>
            <tr><th>Légende</th><th>Symboles</th></tr>
          </thead>
          <tbody>
            ${table9.map((row: any) => `
              <tr>
                <td>${row["Légende"] || row["legende"] || ''}</td>
                <td>${row["Symboles"] || row["symboles"] || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderManagerReview(data: any): string {
    const table10 = this.findTable(data, ["table 10", "revue manager", "Revue manager"]);
    if (!table10 || !Array.isArray(table10)) return "";

    return `
      <div class="worksheet-section manager-review-section">
        <table class="clara-table manager-review-table">
          <thead>
            <tr><th>no</th><th>Superviseur</th><th>Preparer</th></tr>
          </thead>
          <tbody>
            ${table10.map((row: any) => `
              <tr>
                <td>${row.no || row.No || ''}</td>
                <td>${row["Superviseur"] || ''}</td>
                <td>${row["Preparer"] || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderDocumentaryCrossRefs(data: any): string {
    const table8 = this.findTable(data, ["table 8", "cross references documentaire"]);
    if (!table8 || !Array.isArray(table8)) return "";

    return `
      <div class="worksheet-section doc-cross-refs-section">
        <table class="clara-table doc-cross-refs-table">
          <thead>
            <tr><th>no</th><th>Cross references</th><th>Document</th><th>Client</th><th>Exercice</th></tr>
          </thead>
          <tbody>
            ${table8.map((row: any) => `
              <tr>
                <td>${row.no || row.No || ''}</td>
                <td>${row["Cross references"] || row["cross_references"] || ''}</td>
                <td>${row["Document"] || ''}</td>
                <td>${row["Client"] || ''}</td>
                <td>${row["Exercice"] || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Helper Methods

  private findTable(data: any, keywords: string[]): any {
    // Search in top level keys
    for (const key of Object.keys(data)) {
      if (keywords.some(kw => key.toLowerCase().includes(kw.toLowerCase()))) {
        return data[key];
      }
    }

    // Search inside arrays (like "Etape mission - Feuille couverture")
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        for (const item of data[key]) {
          for (const subKey of Object.keys(item)) {
            if (keywords.some(kw => subKey.toLowerCase().includes(kw.toLowerCase()))) {
              return item[subKey];
            }
          }
        }
      }
    }

    return null;
  }

  private getNatureDeTest(data: any): string {
    const table1 = this.findTable(data, ["table 1"]);
    if (table1) {
      const item = Array.isArray(table1) ? table1[0] : table1;
      const nature = item["Nature de test"] || item["nature_de_test"] || "";
      if (nature) return nature;
    }

    // Auto-detection logic if missing
    const table2 = this.findTable(data, ["table 2", "objectifs"]);
    const objectives = table2 ? (Array.isArray(table2) ? table2[0]["OBJECTIFS"] : table2["OBJECTIFS"]) : "";
    const table5 = this.findTable(data, ["table 5"]);
    const headers = table5 && table5.length > 0 ? Object.keys(table5[0]).join(" ").toLowerCase() : "";

    if (objectives?.toLowerCase().includes("rapprochement") || headers.includes("physique")) return "Rapprochement";
    if (objectives?.toLowerCase().includes("tva") || headers.includes("18%")) return "Cadrage Tva";
    if (objectives?.toLowerCase().includes("mouvement") || headers.includes("stock")) return "Mouvement";
    if (objectives?.toLowerCase().includes("estimation")) return "Estimation";
    if (objectives?.toLowerCase().includes("coupure") || objectives?.toLowerCase().includes("separation")) return "Separation";
    
    return "Validation"; // Default
  }

  private getCellClass(header: string): string {
    const h = header.toLowerCase();
    if (h.includes("assertion")) return "col-assertion";
    if (h.includes("conclusion")) return "col-conclusion";
    if (h.includes("ctr") || h.includes("contrôle")) return "col-ctr";
    if (h.includes("ecart") || h.includes("écart")) return "col-ecart";
    if (h.includes("x-ref")) return "col-x-ref-v";
    return "";
  }

  private isMonetaryHeader(header: string): boolean {
    const h = header.toLowerCase();
    const keywords = ["solde", "montant", "ecart", "écart", "physique", "théorique", "valeur", "fcfa", "euro", "usd"];
    return keywords.some(kw => h.includes(kw));
  }
}

export const claraPapierTravailService = new ClaraPapierTravailService();
