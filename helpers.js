const User = require('./models/user');

//// FILES MANAGEMENT

const aws = require('aws-sdk');

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

exports.deleteFile = (fileLocation) => {
  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: fileLocation.split('/')[fileLocation.split('/').length - 1],
  };
  s3.deleteObject(params, (err) => {
    if (err) {
      console.log(err);
    }
  });
};

exports.doesFileExist = async (document) => {
  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: document.fileUrl,
  };

  try {
    await s3.headObject(params).promise();
    return true;
  } catch (err) {
    return false;
  }
};

exports.getDocumentsWithMissingFiles = async (documents) => {
  const documentsWithMissingFiles = [];

  for (let document of documents) {
    if (!(await this.doesFileExist(document))) {
      documentsWithMissingFiles.push(document);
    }
  }

  return documentsWithMissingFiles;
};

exports.isDocumentPartOf = (document, documents) => {
  return documents
    .map((doc) => {
      return doc._id;
    })
    .includes(document._id);
};

exports.hasSwapFolderMissingFiles = async (swapFolder) => {
  for (let rd of swapFolder.proRequestId.requestedDocIds) {
    for (let doc of rd.documentIds) {
      if (!(await this.doesFileExist(doc))) {
        return true;
      }
    }
  }
  return false;
};

exports.getSwapFoldersWithMissingFiles = async (swapFolders) => {
  const swapFoldersWithMissingFiles = [];

  for (let swapFolder of swapFolders) {
    if (await this.hasSwapFolderMissingFiles(swapFolder)) {
      swapFoldersWithMissingFiles.push(swapFolder);
    }
  }

  return swapFoldersWithMissingFiles;
};

exports.isSwapFolderPartOf = (swapFolder, swapFolders) => {
  return swapFolders
    .map((sf) => {
      return sf._id;
    })
    .includes(swapFolder._id);
};

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
  // let todayString = new Date().toLocaleDateString();

  // const todayArray = [];
  // todayArray[0] = todayString.split('/')[2];
  // todayArray[1] = todayString.split('/')[1];
  // todayArray[2] = todayString.split('/')[0];

  // todayString = todayArray.join('-');
  // today = new Date(todayString);

  // return today;

  return new Date(new Date().setHours(0, 0, 0));
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

exports.displayRequestedDocAge = (populatedRequestedDoc) => {
  const age = populatedRequestedDoc.age;

  if (age) {
    let displayedAge;

    if (populatedRequestedDoc.doctypeId.periodicity === 'month') {
      if (age === 1) {
        displayedAge = 'Mois dernier';
      } else {
        displayedAge = `${age} derniers mois`;
      }
    } else if (populatedRequestedDoc.doctypeId.periodicity === 'year') {
      if (age === 1) {
        displayedAge = 'Année dernière';
      } else {
        displayedAge = `${age} dernières années`;
      }
    } else {
      displayedAge = `Datant d'il y a moins de ${age} mois`;
    }

    return displayedAge;
  }
};

exports.makeGroupsOfRequestedDocs = (requestedDocs) => {
  const groups = [];
  for (let doc of requestedDocs) {
    const otherDocs = requestedDocs.filter((d) => {
      return d !== doc;
    });

    const relatedDocs = otherDocs.filter((d) => {
      return d.alternativeRequestedDocIds.includes(doc._id);
    });

    const relatedGroup = groups.find((group) => {
      return group.some((d) => {
        return relatedDocs.includes(d);
      });
    });

    if (relatedGroup) {
      relatedGroup.push(doc);
    } else {
      const newGroup = [doc];
      groups.push(newGroup);
    }
  }

  return groups;
};

exports.hasUserTheRightDocuments = (
  userDocuments,
  allDoctypes,
  populatedRequestedDoc
) => {
  const requestedDoctype = allDoctypes.find((dt) => {
    return dt._id.toString() === populatedRequestedDoc.doctypeId._id.toString();
  });

  let answer;

  if (populatedRequestedDoc.age) {
    switch (requestedDoctype.periodicity) {
      case 'month':
        answer = true;
        for (let i = populatedRequestedDoc.age; i > 0; i--) {
          if (
            !userDocuments.some((doc) => {
              return (
                doc.doctypeId.toString() === requestedDoctype._id.toString() &&
                getMonthsBack(doc.month, doc.year) === i
              );
            })
          ) {
            answer = false;
            break;
          }
        }
        break;
      case 'year':
        answer = true;
        const currentYear = new Date().getFullYear();
        for (let i = populatedRequestedDoc.age; i > 0; i--) {
          if (
            !userDocuments.some((doc) => {
              return (
                doc.doctypeId.toString() === requestedDoctype._id.toString() &&
                currentYear - doc.year === i
              );
            })
          ) {
            answer = false;
            break;
          }
        }
        break;
      default:
        if (
          userDocuments.some((doc) => {
            return (
              doc.doctypeId.toString() === requestedDoctype._id.toString() &&
              calculateAgeInMonths(doc.issuanceDate) < populatedRequestedDoc.age
            );
          })
        ) {
          answer = true;
        }
    }
  } else {
    if (
      userDocuments.some((doc) => {
        return (
          doc.doctypeId.toString() === requestedDoctype._id.toString() &&
          (doc.expirationDate ? !this.isPast(doc.expirationDate) : true)
        );
      })
    ) {
      answer = true;
    }
  }

  return answer;
};

exports.sortByTitle = (elements) => {
  return elements.sort((e1, e2) => {
    return e1.title > e2.title ? +1 : -1;
  });
};

exports.getNumberOfRequestedGroups = (requestedDocs) => {
  const requestedGroupIds = [];
  for (let rd of requestedDocs) {
    if (
      !rd.alternativeRequestedDocIds ||
      rd.alternativeRequestedDocIds.length === 0
    ) {
      requestedGroupIds.push(rd._id.toString());
    } else if (
      !rd.alternativeRequestedDocIds.some((id) => {
        return requestedGroupIds.includes(id.toString());
      })
    ) {
      requestedGroupIds.push(rd._id.toString());
    }
  }

  return requestedGroupIds.length;
};

exports.getNumberOfCompletedGroups = (requestedDocs) => {
  const completedRequestedDocs = [];
  for (let rd of requestedDocs) {
    if (rd.documentIds && rd.documentIds.length > 0) {
      completedRequestedDocs.push(rd);
    }
  }
  return this.getNumberOfRequestedGroups(completedRequestedDocs);
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

function getMonthsBack(month, year) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  if (year === currentYear) {
    return currentMonth - month;
  }

  const previousYears = currentYear - year;
  const addedMonths = 12 - month;
  const separatingYears = previousYears - 1;

  return currentMonth + addedMonths + separatingYears * 12;
}

function calculateAgeInMonths(date) {
  const monthsBack = getMonthsBack(date.getMonth() + 1, date.getFullYear());
  const currentDay = new Date().getDate();
  const day = date.getDate();

  if (day > currentDay) {
    return monthsBack - 1;
  }

  return monthsBack;
}
