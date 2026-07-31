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
    var usuario = (data.usuario || 'Desconhecido').toString().trim();
    var dataHora = data.dataHora ? new Date(data.dataHora) : new Date();

    if (!tombo) {
      return jsonResponse({ status: 'error', message: 'Tombo vazio' });
    }

    var sheet = getSheet();
    ensureHeader(sheet);
    sheet.appendRow([dataHora, tombo, dispositivo, usuario]);

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
  var headers = ['DATA_HORA', 'TOMBO', 'DISPOSITIVO', 'USUARIO'];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return;
  }

  // Planilhas criadas antes da coluna USUARIO existir: completa o cabecalho sem mexer nos dados.
  var lastColumn = sheet.getLastColumn();
  if (lastColumn < headers.length) {
    var missing = headers.slice(lastColumn);
    sheet.getRange(1, lastColumn + 1, 1, missing.length).setValues([missing]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
