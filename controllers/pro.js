const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

const User = require('../models/user');
const SwapFolder = require('../models/swap-folder');
const Doctype = require('../models/doctype');
const RequestedDoc = require('../models/requested-doc');
const Request = require('../models/request');
const Document = require('../models/document');

const helpers = require('../helpers');

//

exports.getSwapFolders = async (req, res, next) => {
  try {
    const pro = await req.pro.populate('swapFolderIds');
    const swapFolders = [];

    for (let swapFolderId of pro.swapFolderIds) {
      let sf = await SwapFolder.findById(swapFolderId)
        .populate('userId', 'email firstName lastName')
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

    const swapFoldersWithMissingFiles = await helpers.getSwapFoldersWithMissingFiles(
      swapFolders
    );

    res.render('pro/swap-folders', {
      pageTitle: "Dossiers d'échange",
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
  const allDoctypes = await Doctype.find();

  try {
    const swapFolder = await SwapFolder.findById(swapFolderId)
      .populate({ path: 'userId', populate: 'documentIds' })
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

    if (swapFolder.proId.toString() !== req.pro._id.toString()) {
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

    const swapFolderDocumentsWithMissingFiles = await helpers.getDocumentsWithMissingFiles(
      swapFolderDocuments
    );

    helpers.sortDocuments(swapFolderDocuments);

    res.render('pro/swap-folder', {
      pageTitle: `Client : ${
        swapFolder.userId.lastName
          ? swapFolder.userId.firstName + ' ' + swapFolder.userId.lastName
          : swapFolder.userId.email
      } - Dossier d'échange n° ${swapFolder._id}`,
      path: '/swap-folders',
      swapFolder: swapFolder,
      swapFolderDocuments: swapFolderDocuments,
      userDocuments: swapFolder.userId.documentIds,
      allDoctypes: allDoctypes,
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

    // Autorisation
    const requestedDoc = await RequestedDoc.findOne({
      documentIds: documentId,
    });
    const request = requestedDoc
      ? await Request.findOne({ requestedDocIds: requestedDoc._id })
      : null;
    const swapFolder = request
      ? await SwapFolder.findOne({ proRequestId: request._id })
      : null;

    if (!swapFolder || !req.pro.swapFolderIds.includes(swapFolder._id)) {
      const error = new Error(
        "Vous n'êtes pas autorisé à accéder au document demandé."
      );
      error.statusCode = 403;
      throw error;
    }

    const doesFileExist = await helpers.doesFileExist(document);

    res.render('pro/document', {
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

exports.postDeleteSwapFolder = async (req, res, next) => {
  const pro = req.pro;
  const swapFolderId = req.params.swapFolderId;
  try {
    const swapFolder = await SwapFolder.findById(swapFolderId);
    if (!swapFolder) {
      const error = new Error("Le dossier d'échange n'a pu être trouvé.");
      error.statusCode = 404;
      throw error;
    }

    const user = await User.findById(swapFolder.userId);
    if (!user) {
      const error = new Error(
        "L'utilisateur correspondant à ce dossier d'échange n'a pu être trouvé."
      );
      error.statusCode = 404;
      throw error;
    }

    user.swapFolderIds = user.swapFolderIds.filter((fileId) => {
      return fileId.toString() !== swapFolder._id.toString();
    });
    await user.save();

    pro.swapFolderIds = pro.swapFolderIds.filter((fileId) => {
      return fileId.toString() !== swapFolder._id.toString();
    });
    await pro.save();

    // Suppression de la requête pro et de ses documents requis
    const proRequest = await Request.findById(swapFolder.proRequestId);
    for (let requestedDocId of proRequest.requestedDocIds) {
      await RequestedDoc.deleteOne({ _id: requestedDocId });
    }
    await Request.deleteOne({ _id: proRequest._id });

    // Suppression de la requête user et de ses documents requis
    const userRequest = await Request.findById(swapFolder.userRequestId);
    for (let requestedDocId of userRequest.requestedDocIds) {
      await RequestedDoc.deleteOne({ _id: requestedDocId });
    }
    await Request.deleteOne({ _id: userRequest._id });

    // Suppression du dossier
    await SwapFolder.deleteOne({ _id: swapFolder._id });

    res.redirect('/pro/swap-folders');
  } catch (err) {
    next(err);
  }
};

exports.getEnterClientEmail = (req, res, next) => {
  res.render('pro/enter-client-email', {
    pageTitle: "Nouveau dossier d'échange",
    path: '/swap-folders',
    oldInput: {
      email: '',
    },
    validationErrors: [],
    errorMessages: [],
  });
};

exports.postEnterClientEmail = async (req, res, next) => {
  const email = req.body.email;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => {
      return err.msg;
    });
    return res.render('pro/enter-client-email', {
      pageTitle: "Dossiers d'échange",
      path: '/swap-folders',
      oldInput: {
        email: email,
      },
      validationErrors: errors.array(),
      errorMessages: errorMessages,
    });
  }

  try {
    const user = await User.findOne({ email: email });

    if (user) {
      return res.redirect(`/pro/add-swap-folder/${user._id}`);
    }

    return res.redirect(`/pro/add-client/${email}`);
  } catch (err) {
    next(err);
  }
};

exports.getAddClient = (req, res, next) => {
  const email = req.params.clientEmail;
  return res.render('pro/add-client', {
    pageTitle: 'Nouveau client',
    path: '/clients',
    email: email,
    oldInput: {
      password: '',
      confirmPassword: '',
    },
    errorMessages: [],
    validationErrors: [],
  });
};

exports.postAddClient = async (req, res, next) => {
  const email = req.body.email;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => {
      return err.msg;
    });
    return res.render('pro/add-client', {
      pageTitle: 'Nouveau client',
      path: '/clients',
      email: email,
      oldInput: {
        firstName: firstName,
        lastName: lastName,
        password: password,
        confirmPassword: confirmPassword,
      },
      errorMessages: errorMessages,
      validationErrors: errors.array(),
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      password: hashedPassword,
      firstName: firstName,
      lastName: lastName,
    });
    await user.save((err) => {
      if (err) {
        err.message =
          "Un problème est survenu sur le serveur et l'utilisateur n'a pas pu être enregistré. Nous travaillons à résoudre le problème et vous prions de bien vouloir nous excuser.";
        throw err;
      }
    });

    res.redirect(`/pro/add-swap-folder/${user._id}`);
  } catch (err) {
    next(err);
  }
};

exports.getAddSwapFolder = async (req, res, next) => {
  const clientId = req.params.clientId;

  try {
    const user = await User.findById(clientId);
    if (!user) {
      const error = new Error("L'utilisateur n'a pas pu être trouvé.");
      error.statusCode = 404;
      throw error;
    }

    res.render('pro/add-swap-folder', {
      pageTitle: "Nouveau dossier d'échange",
      path: '/swap-folders',
      user: user,
    });
  } catch (err) {
    next(err);
  }
};

exports.postAddSwapFolder = async (req, res, next) => {
  const pro = req.pro;

  try {
    const user = await User.findById(req.body.userId);
    if (!user) {
      const error = new Error('Aucun utilisateur trouvé.');
      error.statusCode = 404;
      throw error;
    }

    const userRequest = new Request();
    const proRequest = new Request();

    await userRequest.save();
    await proRequest.save();

    const swapFolder = new SwapFolder({
      userId: user._id,
      proId: req.pro._id,
      userRequestId: userRequest._id,
      proRequestId: proRequest._id,
    });
    await swapFolder.save();
    user.swapFolderIds.push(swapFolder._id);
    await user.save();

    pro.swapFolderIds.push(swapFolder._id);
    await pro.save();

    await swapFolder.populate('userId').execPopulate();

    res.redirect(`/pro/edit-request/${swapFolder.proRequestId}`);
  } catch (err) {
    next(err);
  }
};

exports.getEditRequest = async (req, res, next) => {
  try {
    const doctypes = await Doctype.find();
    if (!doctypes) {
      const error = new Error('Aucun type de document trouvé.');
      error.statusCode = 404;
      throw error;
    }
    const request = await Request.findById(req.params.requestId).populate({
      path: 'requestedDocIds',
      populate: { path: 'doctypeId' },
    });

    if (!request) {
      const error = new Error('Aucune requête trouvée.');
      error.statusCode = 404;
      throw error;
    }

    const swapFolder = await helpers.getSwapFolderOfRequest(request);

    if (!swapFolder) {
      const error = new Error("Le dossier d'échange n'a pu être trouvé.");
      error.statusCode = 404;
      throw error;
    }

    if (swapFolder.proId.toString() !== req.pro._id.toString()) {
      const error = new Error(
        "Vous n'êtes pas autorisé à accéder au dossier d'échange demandé."
      );
      error.statusCode = 403;
      throw error;
    }

    const user = await User.findById(swapFolder.userId);

    res.render('pro/edit-request', {
      pageTitle: `Demande de documents - ${
        user.lastName ? user.firstName + ' ' + user.lastName : user.email
      }`,
      path: '/swap-folders',
      doctypes: helpers.sortByTitle(doctypes),
      request: request,
    });
  } catch (err) {
    next(err);
  }
};

exports.postEditRequest = async (req, res, next) => {
  const requestId = req.body.requestId;

  try {
    const request = await Request.findById(requestId);

    if (!request) {
      const error = new Error('Requête non trouvée.');
      error.statusCode = 404;
      throw error;
    }

    let docInputs = req.body.requestedDocs;

    if (typeof docInputs === 'string') {
      docInputs = [docInputs];
    }

    const parsedInputs = docInputs.map((di) => {
      return JSON.parse(di);
    });

    const requestedDocsToAdd = parsedInputs.map((pi) => {
      return {
        age: pi.age ? +pi.age : null,
        title: pi.title,
        docGroupId: pi.docGroupId ? +pi.docGroupId : null,
        doctypeId: pi.doctypeId,
        requestedDocId: pi.requestedDocId,
      };
    });

    // RD préexistants : suppression en base de ceux qui ont été supprimés
    for (let rdId of request.requestedDocIds) {
      if (
        !requestedDocsToAdd.some((rdToAdd) => {
          return (
            rdToAdd.requestedDocId &&
            rdToAdd.requestedDocId.toString() === rdId.toString()
          );
        })
      ) {
        await RequestedDoc.deleteOne({ _id: rdId });
        request.requestedDocIds = request.requestedDocIds.filter((id) => {
          return id.toString() !== rdId.toString();
        });
      }
    }

    const repeatedGroupIds = requestedDocsToAdd.map((rd) => {
      return rd.docGroupId;
    });
    let docGroupIds = [];
    for (let id of repeatedGroupIds) {
      if (!docGroupIds.includes(id)) {
        docGroupIds.push(id);
      }
    }

    for (let groupId of docGroupIds) {
      const group = requestedDocsToAdd.filter((rd) => {
        return rd.docGroupId === groupId;
      });

      const requestedDocs = [];
      for (let rdToAdd of group) {
        let requestedDoc;
        if (rdToAdd.requestedDocId) {
          requestedDoc = await RequestedDoc.findById(rdToAdd.requestedDocId);
        } else {
          requestedDoc = new RequestedDoc({
            title: rdToAdd.title,
            age: rdToAdd.age,
            doctypeId: rdToAdd.doctypeId,
          });
        }
        requestedDocs.push(requestedDoc);
      }

      for (let requestedDoc of requestedDocs) {
        let siblingDocIds;
        if (groupId) {
          siblingDocIds = requestedDocs
            .filter((rd) => {
              return rd !== requestedDoc;
            })
            .map((rd) => {
              return rd._id;
            });
        } else {
          siblingDocIds = [];
        }
        requestedDoc.alternativeRequestedDocIds = siblingDocIds;

        try {
          await requestedDoc.save();
          if (!request.requestedDocIds.includes(requestedDoc._id)) {
            request.requestedDocIds.push(requestedDoc._id);
          }
        } catch (err) {
          err.message =
            'Un problème est survenu lors de la sauvegarde des documents requis. Nous travaillons à le réparer.';
          return next(err);
        }
      }
    }

    // Sauvegarde de la requête
    await request.save();

    // Redirection
    const swapFolder = await SwapFolder.findOne({ proRequestId: requestId });
    res.redirect(`/pro/swap-folders/${swapFolder._id}`);
  } catch (err) {
    next(err);
  }
};

exports.postResetRequest = async (req, res, next) => {
  const requestId = req.params.requestId;

  try {
    const request = await Request.findById(requestId);
    if (!request) {
      const error = new Error('Requête non trouvée');
      error.statusCode = 404;
      throw error;
    }

    for (let requestedDocId of request.requestedDocIds) {
      await RequestedDoc.deleteOne({ _id: requestedDocId });
    }

    request.requestedDocIds = [];

    await request.save();

    const swapFolder = await SwapFolder.findOne({ proRequestId: request._id });
    res.redirect(`/pro/swap-folders/${swapFolder._id}`);
  } catch (err) {
    next(err);
  }
};
