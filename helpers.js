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

exports.isFuture = (date) => {
  const today = this.getCurrentDate();
  return date > today;
};

exports.isPast = (date) => {
  const today = this.getCurrentDate();
  return date < today;
};
