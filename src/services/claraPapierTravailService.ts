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
    if (typeof data === 'string' && data.toLowerCase().includes("nature de test")) {
      return true;
    }
    
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
   * Parses a markdown string into the JSON format expected by this service
   */
  public parseMarkdownToJSON(markdown: string): any {
    const sections = markdown.split(/(?:\r?\n){2,}/);
    const result: any = { "Etape mission - Feuille couverture": [] };
    
    let tableIndex = 0;
    
    sections.forEach((section) => {
      const lines = section.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.startsWith('|'));
      if (lines.length < 3) return; // Pas une table markdown valide
      
      // Extraction des en-têtes
      const headers = lines[0].split('|').map(h => h.trim()).slice(1, -1);
      
      // Les données commencent à l'index 2 (après la ligne de séparation |---|---|)
      const dataRows = lines.slice(2);
      
      const tableData = dataRows.map(row => {
        // Extraire les cellules en ignorant les pipes de bordure
        const cells = row.split('|').map(c => c.trim()).slice(1, -1);
        const rowObj: any = {};
        headers.forEach((h, i) => {
          rowObj[h] = cells[i] || "";
        });
        return rowObj;
      });
      
      let tableName = `table ${tableIndex}`;
      if (tableIndex === 0) tableName = "table 0 - Signature worksheet";
      
      const tableObj: any = {};
      tableObj[tableName] = tableData;
      result["Etape mission - Feuille couverture"].push(tableObj);
      
      tableIndex++;
    });
    
    return result;
  }
  /**
   * Pivote les deux premières tables Markdown (Signature et Couverture) 
   * pour les transformer de N-colonnes à 2 colonnes (Rubrique, Description)
   */
  public pivotMarkdownTables(markdown: string): string {
    const sections = markdown.split(/(?:\r?\n){2,}/);
    let tableIndex = 0;
    
    const modifiedSections = sections.map((section) => {
      const lines = section.trim().split(/\r?\n/).map(l => l.trim());
      const tableLines = lines.filter(l => l.startsWith('|'));
      
      if (tableLines.length < 3) return section; // Pas une table markdown valide
      
      // Pivot only the first two tables
      if (tableIndex === 0 || tableIndex === 1) {
        const headers = tableLines[0].split('|').map(h => h.trim()).slice(1, -1);
        const dataRows = tableLines.slice(2);
        
        let newTable = `| Rubrique | Description |\n|---|---|`;
        
        if (dataRows.length > 0) {
          const cells = dataRows[0].split('|').map(c => c.trim()).slice(1, -1);
          headers.forEach((h, i) => {
            if (h) {
              newTable += `\n| ${h} | ${cells[i] || ""} |`;
            }
          });
          
          tableIndex++;
          return newTable;
        }
      }
      
      tableIndex++;
      return section;
    });
    
    return modifiedSections.join('\n\n');
  }

  /**
   * Processes the data to generate the audit workpaper HTML/Markdown
   */
  public process(data: any): string {
    // Si c'est une string markdown, on pivote simplement les deux premières tables
    // et on retourne le markdown pour qu'il soit rendu avec le style standard du thème.
    if (typeof data === 'string') {
      return this.pivotMarkdownTables(data);
    }
    
    let html = `
      <style>
        .clara-papier-travail { font-family: 'Inter', sans-serif; color: #333; }
        .clara-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.9em; }
        .clara-table th, .clara-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .clara-table th { background-color: #f8f9fa; font-weight: 600; }
        .section-bar { background: #1855A3; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 6px 12px; margin-bottom: 0; border-radius: 4px 4px 0 0; }
        /* Interactive columns */
        .col-assertion, .col-conclusion, .col-ctr { cursor: pointer; background-color: #fdfdfe; }
        .col-assertion:hover, .col-conclusion:hover, .col-ctr:hover { background-color: #f0f7ff; }
        /* Misc */
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
        <table class="clara-table signature-table">
          <thead>
            <tr><th>Rubrique</th><th>Description</th></tr>
          </thead>
          <tbody>
            ${Object.entries(item).map(([key, value]) => `
              <tr>
                <td><strong>${key.charAt(0).toUpperCase() + key.slice(1)}</strong></td>
                <td>${value}</td>
              </tr>
            `).join('')}
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
        <table class="clara-table mission-info-table">
          <thead>
            <tr><th>Rubrique</th><th>Description</th></tr>
          </thead>
          <tbody>
            ${Object.entries(item).map(([key, value]) => `
              <tr>
                <td><strong>${key.charAt(0).toUpperCase() + key.slice(1)}</strong></td>
                <td>${value}</td>
              </tr>
            `).join('')}
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

    // Main Table Headers
    const headers = Object.keys(table5[0]);

    return `
      <div class="worksheet-section test-section">
        <div class="section-bar">Tests</div>
        <div class="test-table-container">
          <table class="clara-table main-test-table" id="main-test-table">
            <thead>
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
            </tbody>
          </table>
        </div>
      </div>
    `;
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
