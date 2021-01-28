const fs = require('fs');

const User = require('./models/user');

//

exports.getUserDoctypeIds = async (user) => {
  let userDoctypeIds = await User.findById(user._id).populate(
    'documentIds',
    'doctypeId -_id'
  );
  return userDoctypeIds.documentIds.map((docId) => {
    return docId.doctypeId;
  });
};

exports.getCurrentDate = () => {
  let todayString = new Date().toLocaleDateString();

  const todayArray = [];
  todayArray[0] = todayString.split('/')[2];
  todayArray[1] = todayString.split('/')[1];
  todayArray[2] = todayString.split('/')[0];

  todayString = todayArray.join('-');
  today = new Date(todayString);

  return today;
};

exports.dateToInputFormat = (date) => {
  return date.toISOString().split('T')[0];
};

exports.isPast = (date) => {
  const today = this.getCurrentDate();
  return date < today;
};

exports.isPresent = (date) => {
  return !this.isPast(date) && !this.isFuture(date);
};

exports.isFuture = (date) => {
  const today = this.getCurrentDate();
  return date > today;
};

exports.calculateAge = (date) => {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  let age = todayYear - year;
  const ageMonth = todayMonth - month;
  const ageDay = todayDay - day;

  if (ageMonth < 0 || (ageMonth == 0 && ageDay < 0)) {
    age = parseInt(age) - 1;
  }

  return age;
};

exports.deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        throw err;
      }
    });
  }
};

exports.monthToString = (monthNumber) => {
  const monthsArray = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  return monthsArray[monthNumber - 1];
};

exports.monthAndYearToMonthFormat = (month, year) => {
  let monthFormat;
  if (month > 10) {
    monthFormat = month.toString();
  } else {
    monthFormat = `0${month}`;
  }

  return `${year}-${monthFormat}`;
};

exports.displayDate = (date) => {
  const day = date.getDate();
  const month = this.monthToString(date.getMonth() + 1);
  const year = date.getFullYear();

  if (day === 1) {
    return `${day}er ${month} ${year}`;
  }
  return `${day} ${month} ${year}`;
};

exports.sortByTitle = (items) => {
  items.sort((item1, item2) => {
    return item1.title > item2.title ? +1 : -1;
  });
};

exports.sortDocuments = (documents) => {
  sortDocumentsByTitle(documents);
  sortDocumentsByDate(documents);
  sortDocumentsByMonth(documents);
  sortDocumentsByYear(documents);
  sortDocumentsByDoctypeTitle(documents);
};

// PRIVATE

function sortDocumentsByDoctypeTitle(documents) {
  documents.sort((doc1, doc2) => {
    return doc1.doctypeId.title < doc2.doctypeId.title ? -1 : +1;
  });
}

function sortDocumentsByYear(documents) {
  documents.sort((doc1, doc2) => {
    return doc1.year > doc2.year ? -1 : +1;
  });
}

function sortDocumentsByMonth(documents) {
  documents.sort((doc1, doc2) => {
    return doc1.month > doc2.month ? -1 : +1;
  });
}

function sortDocumentsByDate(documents) {
  documents.sort((doc1, doc2) => {
    return doc1.issuanceDate > doc2.issuanceDate ? -1 : +1;
  });
}

function sortDocumentsByTitle(documents) {
  documents.sort((doc1, doc2) => {
    return doc1.title < doc2.title ? -1 : +1;
  });
}
