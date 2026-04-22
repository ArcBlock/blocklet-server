/* eslint-disable prettier/prettier */
module.exports = {
  registry: {
    getListError: '"{registryUrl}" से ब्लॉकलेट सूची प्राप्त करने में विफल हुआ।',
  },
  backup: {
    space: {
      error: {
        title: 'Error al realizar el backup en DID Spaces',
        forbidden:
          'आपको बैकअप कार्य करने की अनुमति नहीं है, DID स्पेस पर एप्लिकेशन लाइसेंस को पुनर्स्थापित करने का प्रयास करें या DID स्पेस से फिर से कनेक्ट करें और पुनः प्रयास करें',
      },
      isFull: 'वर्तमान DID Space भंडारण स्थान भरा है, कृपया स्थान बढ़ाएं और पुनः बैकअप लें',
      lackOfSpace: 'उपलब्ध भंडारण में वर्तमान में कमी है, कृपया स्थान बढ़ाएं और पुनः बैकअप करें',
      unableEnableAutoBackup: 'ऑटो बैकअप सक्षम नहीं हो पाया है, कृपया पहले DID Spaces से कनेक्ट करें',
    },
  },
};
