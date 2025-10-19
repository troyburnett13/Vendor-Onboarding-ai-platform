// forms/google-apps-script.gs
function onFormSubmit(e) {
  try {
    const responses = e.namedValues;
    const email = responses['Email'][0] || 'unknown@example.com';
    // If you allow file upload, you need to host a separate Google Drive -> your backend flow.
    const payload = {
      email: email,
      company: responses['Company Name'] ? responses['Company Name'][0] : '',
      fields: responses
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const url = 'https://your-backend.example.com/api/webhook/form-submission';
    UrlFetchApp.fetch(url, options);
  } catch (err) {
    Logger.log('Error in onFormSubmit: ' + err);
  }
}
