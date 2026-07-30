/**
 * Backend do Scanner de Tombos.
 * Cole este código em Extensões > Apps Script da sua planilha Google Sheets
 * e publique como "Aplicativo da Web" (Execute como: Eu / Acesso: Qualquer pessoa).
 */

var SHEET_NAME = 'Scans';

function doGet(e) {
  var action = e.parameter.action;
  if (action === 'ping') {
    var sheet = getSheet();
    return jsonResponse({
      status: 'ok',
      planilha: SpreadsheetApp.getActiveSpreadsheet().getName(),
      aba: sheet.getName(),
    });
  }
  return jsonResponse({ status: 'error', message: 'Ação inválida' });
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var tombo = (data.tombo || '').toString().trim();
    var dispositivo = (data.dispositivo || 'Desconhecido').toString().trim();
    var dataHora = data.dataHora ? new Date(data.dataHora) : new Date();

    if (!tombo) {
      return jsonResponse({ status: 'error', message: 'Tombo vazio' });
    }

    var sheet = getSheet();
    ensureHeader(sheet);
    sheet.appendRow([dataHora, tombo, dispositivo]);

    return jsonResponse({ status: 'ok' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function ensureHeader(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['DATA_HORA', 'TOMBO', 'DISPOSITIVO']);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
