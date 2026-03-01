function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'getProducts') {
      var sheet = ss.getSheetByName("Products");
      if (!sheet) return jsonResponse({ error: "Products sheet not found" });
      var data = getSheetData(sheet);
      return jsonResponse(data);
    }
    
    if (action === 'getOrders') {
      var sheet = ss.getSheetByName("Orders");
      if (!sheet) return jsonResponse({ error: "Orders sheet not found" });
      var data = getSheetData(sheet);
      return jsonResponse(data);
    }
    
    return jsonResponse({ error: "Invalid action" });
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var payload = data.payload;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    switch(action) {
      case 'addProduct':
      case 'add_product':
        var sheet = ss.getSheetByName("Products");
        if (!sheet) return jsonResponse({ error: "Products sheet not found" });
        
        var id = "PRD-" + new Date().getTime();
        var imageUrl = payload.imageBase64; // In a real app, you might upload to Drive and get a URL
        
        sheet.appendRow([
          id,
          payload.name,
          payload.price,
          payload.discountedPrice,
          imageUrl,
          payload.description
        ]);
        return jsonResponse({ success: true, id: id });
        
      case 'delete_product':
        var sheet = ss.getSheetByName("Products");
        if (!sheet) return jsonResponse({ error: "Products sheet not found" });
        
        var dataRange = sheet.getDataRange();
        var values = dataRange.getValues();
        var productId = data.productId;
        
        // Find row index (1-based for Apps Script)
        var rowIndex = -1;
        for (var i = 1; i < values.length; i++) { // Skip header
          if (values[i][0] === productId) {
            rowIndex = i + 1;
            break;
          }
        }
        
        if (rowIndex > -1) {
          sheet.deleteRow(rowIndex);
          return jsonResponse({ success: true });
        }
        return jsonResponse({ error: "Product not found" });
        
      case 'updateOrderStatus':
      case 'update_order_status':
        var sheet = ss.getSheetByName("Orders");
        if (!sheet) return jsonResponse({ error: "Orders sheet not found" });
        
        var dataRange = sheet.getDataRange();
        var values = dataRange.getValues();
        var orderId = payload.orderId;
        var newStatus = payload.status;
        
        // Find row index and status column index
        var headerRow = values[0];
        var statusColIndex = headerRow.indexOf("Status") > -1 ? headerRow.indexOf("Status") : headerRow.indexOf("status");
        if (statusColIndex === -1) {
            statusColIndex = headerRow.length; // Default to end if not found
        }
        
        var rowIndex = -1;
        for (var i = 1; i < values.length; i++) {
          if (values[i][0] === orderId) {
            rowIndex = i + 1;
            break;
          }
        }
        
        if (rowIndex > -1) {
          sheet.getRange(rowIndex, statusColIndex + 1).setValue(newStatus);
          return jsonResponse({ success: true });
        }
        return jsonResponse({ error: "Order not found" });
        
      case 'addOrder':
      case 'add_order':
        var sheet = ss.getSheetByName("Orders");
        if (!sheet) return jsonResponse({ error: "Orders sheet not found" });
        
        var id = "ORD-" + new Date().getTime();
        var timestamp = new Date().toISOString();
        
        sheet.appendRow([
          id,
          timestamp,
          payload.customerName,
          payload.mobileNumber,
          payload.address,
          payload.totalAmount,
          payload.paymentMethod,
          JSON.stringify(payload.items),
          "Pending"
        ]);
        return jsonResponse({ success: true, id: id });
        
      default:
        return jsonResponse({ error: "Invalid action" });
    }
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

function getSheetData(sheet) {
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  if (values.length === 0) return [];
  
  var headers = values[0];
  var data = [];
  
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    data.push(obj);
  }
  
  return data;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
