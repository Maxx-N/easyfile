const { validationResult } = require('express-validator');

const Doctype = require('../models/doctype');
const Document = require('../models/document');
const SwapFolder = require('../models/swap-folder');
const RequestedDoc = require('../models/requested-doc');

const helpers = require('../helpers');

//

exports.getDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({ userId: req.user._id }).populate(
      'doctypeId'
    );
    if (!documents) {
      const error = new Error('Aucun document trouvé');
      error.statusCode = 404;
      throw error;
    }
    helpers.sortDocuments(documents);

    const documentsWithMissingFiles =
      await helpers.getDocumentsWithMissingFiles(documents);

    res.render('user/documents', {
      pageTitle: 'Mes documents',
      path: '/documents',
      documents: documents,
      monthToString: helpers.monthToString,
      displayDate: helpers.displayDate,
      isPast: helpers.isPast,
      isPresent: helpers.isPresent,
      documentsWithMissingFiles: documentsWithMissingFiles,
      isDocumentPartOf: helpers.isDocumentPartOf,
    });
  } catch (err) {
    if (!err.message) {
      err.message =
        'Un problème est survenu lors de la récupération de vos documents. Merci de bien vouloir nous excuser et réessayer plus tard.';
    }
    next(err);
  }
};

exports.getDocument = async (req, res, next) => {
  const documentId = req.params.documentId;
  try {
    const document = await Document.findById(documentId).populate(
      'doctypeId',
      'title'
    );

    if (!document) {
      const error = new Error(
        "Ce document n'a pas été trouvé. Merci de vérifier qu'il existe toujours."
      );
      error.statusCode = 404;
      throw error;
    }

    if (document.userId.toString() !== req.user._id.toString()) {
      const error = new Error(
        "Vous n'êtes pas autorisé à accéder au document demandé."
      );
      error.statusCode = 403;
      throw error;
    }

    const doesFileExist = await helpers.doesFileExist(document);

    res.render('user/document', {
      pageTitle: document.doctypeId.title,
      path: '/documents',
      document: document,
      doesFileExist: doesFileExist,
      displayDate: helpers.displayDate,
      monthToString: helpers.monthToString,
      isPresent: helpers.isPresent,
      isPast: helpers.isPast,
    });
  } catch (err) {
    next(err);
  }
};

exports.getEditDocument = async (req, res, next) => {
  const editMode = !!req.query.edit;
  try {
    const doctypes = await Doctype.find();
    helpers.sortByTitle(doctypes);
    if (editMode) {
      const documentId = req.params.documentId;
      const document = await Document.findById(documentId);

      if (document.userId.toString() !== req.user._id.toString()) {
        const error = new Error(
          "Vous n'avez pas l'autorisation de modifier ce document."
        );
        error.statusCode = 403;
        throw error;
      }

      const oldFileArray = document.fileUrl.split('-');
      oldFileArray.shift();
      oldFileName = oldFileArray.join('-');

      return res.render('user/edit-document', {
        pageTitle: `Modification de votre document`,
        path: '/documents',
        doctypes: doctypes,
        validationErrors: [],
        errorMessages: [],
        oldInput: {
          doctypeId: document.doctypeId,
          issuanceDate: document.issuanceDate
            ? helpers.dateToInputFormat(document.issuanceDate)
            : '',
          expirationDate: document.expirationDate
            ? helpers.dateToInputFormat(document.expirationDate)
            : '',
          month:
            document.month && document.year
              ? helpers.monthAndYearToMonthFormat(document.month, document.year)
              : '',
          year: document.year && !document.month ? document.year : '',
          title: document.title ? document.title : '',
          fileName: oldFileName,
        },
        editMode: true,
        documentId: document._id,
      });
    }
    res.render('user/edit-document', {
      pageTitle: 'Nouveau document',
      path: '/documents',
      doctypes: doctypes,
      validationErrors: [],
      errorMessages: [],
      oldInput: {
        doctypeId: '',
        issuanceDate: '',
        expirationDate: '',
        month: '',
        year: '',
        title: '',
      },
      editMode: false,
    });
  } catch (err) {
    if (!err.message) {
      err.message =
        'Un problème est survenu lors de la récupération des types de documents. Merci de bien vouloir nous excuser et réessayer plus tard.';
    }
    next(err);
  }
};

exports.postEditDocument = async (req, res, next) => {
  const editMode = !!req.query.edit;

  const doctypeId = req.body.doctypeId;
  const issuanceDate = req.body.issuanceDate
    ? new Date(req.body.issuanceDate)
    : null;
  const expirationDate = req.body.expirationDate
    ? new Date(req.body.expirationDate)
    : null;
  const month = req.body.month ? parseInt(req.body.month.split('-')[1]) : null;
  const title = req.body.title ? req.body.title : null;
  const file = req.file;

  const errors = validationResult(req);

  try {
    if (!errors.isEmpty() || (!file && !editMode)) {
      const validationErrors = [];
      if (!errors.isEmpty()) {
        validationErrors.push(...errors.array());
      }
      if (file) {
        helpers.deleteFile(file.location);
      } else if (!editMode) {
        validationErrors.push({
          msg: 'Vous devez sélectionner un fichier au format PDF (JPG et JPEG acceptés aussi, mais déconseillés).',
          param: 'file',
        });
      }

      const errorMessages = validationErrors.map((err) => err.msg);

      if (editMode) {
        const editedDoc = await Document.findById(req.body.documentId);
        const oldFileArray = editedDoc.fileUrl.split('-');
        oldFileArray.shift();
        oldFileName = oldFileArray.join('-');
      }

      const doctypes = await Doctype.find();
      return res.status(422).render('user/edit-document', {
        pageTitle: editMode ? 'Modification de document' : 'Nouveau document',
        path: '/documents',
        doctypes: doctypes,
        validationErrors: validationErrors,
        errorMessages: errorMessages,
        oldInput: {
          doctypeId: doctypeId,
          issuanceDate: req.body.issuanceDate,
          expirationDate: req.body.expirationDate,
          month: req.body.month,
          year: req.body.year,
          title: title,
          fileName: editMode ? oldFileName : null,
        },
        editMode: editMode,
        documentId: editMode ? req.body.documentId : null,
      });
    }

    let document;

    if (!editMode) {
      document = new Document({
        userId: req.user._id,
        doctypeId: doctypeId,
        fileUrl: file.location.split('/')[file.location.split('/').length - 1],
      });
    } else {
      document = await Document.findById(req.body.documentId);
      if (!document) {
        const error = new Error("Le document à modifier n'a pas été trouvé");
        error.statusCode = 404;
        throw error;
      }

      if (document.userId.toString() !== req.user._id.toString()) {
        if (req.file) {
          helpers.deleteFile(req.file.location);
        }
        const error = new Error(
          "Vous n'avez pas l'autorisation de modifier ce document."
        );
        error.statusCode = 403;
        throw error;
      }
      if (file) {
        helpers.deleteFile(process.env.AWS_PATH + document.fileUrl);
        document.fileUrl =
          file.location.split('/')[file.location.split('/').length - 1];
      }
      document.doctypeId = doctypeId;
    }

    const doctype = await Doctype.findById(document.doctypeId);

    if (editMode) {
      if (doctype.isUnique && document.title) {
        document.title = null;
      }
      if (doctype.periodicity !== 'month' && document.month) {
        document.month = null;
      }
      if (
        doctype.periodicity !== 'month' &&
        doctype.periodicity !== 'year' &&
        document.year
      ) {
        document.year = null;
      }
      if (!doctype.hasIssuanceDate && document.issuanceDate) {
        document.issuanceDate = null;
      }
      if (!doctype.hasExpirationDate && document.expirationDate) {
        document.expirationDate = null;
      }
    }

    let year;
    if (doctype.periodicity === 'month') {
      year = req.body.month ? parseInt(req.body.month.split('-')[0]) : null;
    } else if (doctype.periodicity === 'year') {
      year = req.body.year ? parseInt(req.body.year) : null;
    }

    document.issuanceDate = doctype.hasIssuanceDate ? issuanceDate : null;
    document.expirationDate = doctype.hasExpirationDate ? expirationDate : null;
    document.month = doctype.periodicity === 'month' ? month : null;
    document.year =
      doctype.periodicity === 'month' || doctype.periodicity === 'year'
        ? year
        : null;
    document.title = !doctype.isUnique ? title : null;

    await document.save();

    // Les documents des requestedDocs correspondants sont tous supprimés de ceux-ci
    const parentRequestedDocs = await RequestedDoc.find({
      documentIds: document._id,
    });

    for (let parentRequestedDoc of parentRequestedDocs) {
      parentRequestedDoc.documentIds = [];
      await parentRequestedDoc.save();
    }
    //

    if (!editMode) {
      req.user.documentIds.push(document._id);
      await req.user.save();
    }

    res.redirect('/documents');
  } catch (err) {
    if (!err.message) {
      err.message = editMode
        ? "Le document n'a pas pu être modifié en raison d'un problème sur le serveur. Merci de bien vouloir nous excuser et réessayer plus tard."
        : "Le document n'a pas pu être ajouté en raison d'un problème sur le serveur. Merci de bien vouloir nous excuser et réessayer plus tard.";
    }
    next(err);
  }
};

exports.postDeleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.documentId);
    if (!document) {
      const error = new Error("Le document à supprimer n'a pas été trouvé.");
      error.statusCode = 404;
      throw error;
    }
    if (document.userId.toString() !== req.user._id.toString()) {
      const error = new Error(
        "Vous n'êtes pas autorisé à supprimer ce document."
      );
      error.statusCode = 403;
      throw error;
    }

    helpers.deleteFile(process.env.AWS_PATH + document.fileUrl);
    await Document.deleteOne({ _id: document._id });
    req.user.documentIds = req.user.documentIds.filter((docId) => {
      return docId.toString() !== document._id.toString();
    });
    await req.user.save();

    // Les documents des requestedDocs correspondants sont tous supprimés de ceux-ci
    const parentRequestedDocs = await RequestedDoc.find({
      documentIds: document._id,
    });

    for (let parentRequestedDoc of parentRequestedDocs) {
      parentRequestedDoc.documentIds = [];
      await parentRequestedDoc.save();
    }
    //

    res.redirect('/documents');
  } catch (err) {
    next(err);
  }
};

exports.getSwapFolders = async (req, res, next) => {
  try {
    const user = await req.user.populate('swapFolderIds');
    const swapFolders = [];

    for (let swapFolderId of user.swapFolderIds) {
      let sf = await SwapFolder.findById(swapFolderId)
        .populate('proId', 'email company')
        .populate({
          path: 'proRequestId',
          populate: {
            path: 'requestedDocIds',
            select: ['documentIds', 'alternativeRequestedDocIds'],
            populate: {
              path: 'documentIds',
              select: 'fileUrl',
            },
          },
        });
      swapFolders.push(sf);
    }

    const swapFoldersWithMissingFiles =
      await helpers.getSwapFoldersWithMissingFiles(swapFolders);

    res.render('user/swap-folders', {
      pageTitle: "Mes dossiers d'échange",
      path: '/swap-folders',
      swapFolders: swapFolders,
      getNumberOfRequestedGroups: helpers.getNumberOfRequestedGroups,
      getNumberOfCompletedGroups: helpers.getNumberOfCompletedGroups,
      swapFoldersWithMissingFiles: swapFoldersWithMissingFiles,
      isSwapFolderPartOf: helpers.isSwapFolderPartOf,
    });
  } catch (err) {
    return next(err);
  }
};

exports.getSwapFolder = async (req, res, next) => {
  const swapFolderId = req.params.swapFolderId;

  try {
    const userDocuments = await Document.find({ userId: req.user._id });
    const allDoctypes = await Doctype.find();

    const swapFolder = await SwapFolder.findById(swapFolderId)
      .populate('userId proId')
      .populate({
        path: 'proRequestId userRequestId',
        populate: {
          path: 'requestedDocIds',
          populate: [
            {
              path: 'documentIds',
              populate: 'doctypeId',
            },
            'doctypeId',
          ],
        },
      });

    if (!swapFolder) {
      const error = new Error("Le dossier d'échange n'a pu être trouvé.");
      error.statusCode = 404;
      throw error;
    }

    if (swapFolder.userId._id.toString() !== req.user._id.toString()) {
      const error = new Error(
        "Vous n'êtes pas autorisé à accéder au dossier d'échange demandé."
      );
      error.statusCode = 403;
      throw error;
    }

    const swapFolderDocuments = [];

    for (let requestedDoc of [
      ...swapFolder.proRequestId.requestedDocIds,
      ...swapFolder.userRequestId.requestedDocIds,
    ]) {
      swapFolderDocuments.push(...requestedDoc.documentIds);
    }

    const swapFolderDocumentsWithMissingFiles =
      await helpers.getDocumentsWithMissingFiles(swapFolderDocuments);

    helpers.sortDocuments(swapFolderDocuments);

    res.render('user/swap-folder', {
      pageTitle: `Professionnel : ${
        swapFolder.proId.company
          ? swapFolder.proId.company
          : swapFolder.proId.email
      } - Dossier d'échange n° ${swapFolder._id}`,
      path: '/swap-folders',
      swapFolder: swapFolder,
      userDocuments: userDocuments,
      allDoctypes: allDoctypes,
      swapFolderDocuments: swapFolderDocuments,
      makeGroupsOfRequestedDocs: helpers.makeGroupsOfRequestedDocs,
      displayRequestedDocAge: helpers.displayRequestedDocAge,
      hasUserTheRightDocuments: helpers.hasUserTheRightDocuments,
      monthToString: helpers.monthToString,
      displayDate: helpers.displayDate,
      isPast: helpers.isPast,
      isPresent: helpers.isPresent,
      isDocumentPartOf: helpers.isDocumentPartOf,
      swapFolderDocumentsWithMissingFiles: swapFolderDocumentsWithMissingFiles,
    });
  } catch (err) {
    next(err);
  }
};

exports.postAddDocumentsToRequestedDoc = async (req, res, next) => {
  const requestedDocId = req.params.requestedDocId;
  const documentIds = req.body.documentIds.split(',');

  try {
    const requestedDoc = await RequestedDoc.findById(requestedDocId);

    const swapFolder = await helpers.getSwapFolderOfRequestedDocId(
      requestedDocId
    );

    if (!swapFolder) {
      const error = new Error("Le dossier d'échange n'a pu être trouvé.");
      error.statusCode = 404;
      throw error;
    }

    if (swapFolder.userId.toString() !== req.user._id.toString()) {
      const error = new Error(
        "Vous n'êtes pas autorisé à modifier le dossier d'échange demandé."
      );
      error.statusCode = 403;
      throw error;
    }

    const swapFolderDocumentIds = await helpers.getSwapFolderDocumentIds(
      swapFolder
    );

    if (
      !documentIds.some((id) => {
        return swapFolderDocumentIds
          .map((docId) => {
            return docId.toString();
          })
          .includes(id.toString());
      })
    ) {
      for (let id of documentIds) {
        if (!requestedDoc.documentIds.includes(id)) {
          requestedDoc.documentIds.push(id);
        }
      }
      await requestedDoc.save();
    }

    res.redirect(`/swap-folders/${swapFolder._id}`);
  } catch (err) {
    next(err);
  }
};

exports.postDeleteDocumentsFromRequestedDoc = async (req, res, next) => {
  const requestedDocId = req.params.requestedDocId;
  const documentIds = req.body.documentIds.split(',');

  try {
    const swapFolder = await helpers.getSwapFolderOfRequestedDocId(
      requestedDocId
    );

    if (!swapFolder) {
      const error = new Error("Le dossier d'échange n'a pu être trouvé.");
      error.statusCode = 404;
      throw error;
    }

    if (swapFolder.userId.toString() !== req.user._id.toString()) {
      const error = new Error(
        "Vous n'êtes pas autorisé à modifier le dossier d'échange demandé."
      );
      error.statusCode = 403;
      throw error;
    }

    const requestedDoc = await RequestedDoc.findById(requestedDocId);

    for (let id of documentIds) {
      requestedDoc.documentIds = requestedDoc.documentIds.filter((docId) => {
        return docId.toString() !== id.toString();
      });
    }

    await requestedDoc.save();
    next();
  } catch (err) {
    return next(err);
  }
};
