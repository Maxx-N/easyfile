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

exports.deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      throw err;
    }
  });
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

exports.displayDate = (date) => {
  const day = date.getDate();
  const month = this.monthToString(date.getMonth() + 1);
  const year = date.getFullYear();

  if (day === 1) {
    return `${day}er ${month} ${year}`;
  }
  return `${day} ${month} ${year}`;
};
