const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

const User = require('../models/user');
const SwapFolder = require('../models/swap-folder');
const Doctype = require('../models/doctype');
const RequestedDoc = require('../models/requested-doc');
const Request = require('../models/request');
const helpers = require('../helpers');

//

exports.getSwapFolders = async (req, res, next) => {
  try {
    const pro = await req.pro.populate('swapFolderIds');
    const swapFolders = [];

    for (let swapFolderId of pro.swapFolderIds) {
      let file = await SwapFolder.findById(swapFolderId).populate('userId');
      swapFolders.push(file);
    }

    res.render('pro/swap-folders', {
      pageTitle: 'Dossiers de prêt',
      path: '/swap-folders',
      swapFolders: swapFolders,
    });
  } catch (err) {
    return next(err);
  }
};

exports.getSwapFolder = async (req, res, next) => {
  const swapFolderId = req.params.swapFolderId;

  try {
    const swapFolder = await SwapFolder.findById(swapFolderId)
      .populate('userId')
      .populate({
        path: 'requestIds',
        populate: { path: 'requestedDocIds', populate: 'doctypeId' },
      });

    if (!swapFolder) {
      const error = new Error("Le dossier de prêt n'a pu être trouvé.");
      error.statusCode = 404;
      throw error;
    }

    res.render('pro/swap-folder', {
      pageTitle: 'Dossier de prêt',
      path: '/swap-folders',
      swapFolder: swapFolder,
      makeGroupsOfRequestedDocs: helpers.makeGroupsOfRequestedDocs,
      displayRequestedDocAge: helpers.displayRequestedDocAge,
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
      const error = new Error("Le dossier de prêt n'a pu être trouvé.");
      error.statusCode = 404;
      throw error;
    }

    const user = await User.findById(swapFolder.userId);
    if (!user) {
      const error = new Error(
        "L'utilisateur correspondant à ce dossier de prêt n'a pu être trouvé."
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

    for (let requestId of swapFolder.requestIds) {
      const request = await Request.findById(requestId);
      for (let requestedDocId of request.requestedDocIds) {
        await RequestedDoc.deleteOne({ _id: requestedDocId });
      }
      await request.deleteOne({ _id: requestId });
    }

    await SwapFolder.deleteOne({ _id: swapFolder._id });

    res.redirect('/pro/swap-folders');
  } catch (err) {
    next(err);
  }
};

exports.getEnterClientEmail = (req, res, next) => {
  res.render('pro/enter-client-email', {
    pageTitle: 'Dossiers de prêt',
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
      pageTitle: 'Dossiers de prêt',
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
      pageTitle: 'Nouveau dossier de prêt',
      path: '/swap-folders',
      user: user,
    });
  } catch (err) {
    next(err);
  }
};

exports.postAddSwapFolder = async (req, res, next) => {
  const choice = req.body.choiceOfAction;
  const pro = req.pro;

  try {
    const user = await User.findById(req.body.userId);
    if (!user) {
      const error = new Error('Aucun utilisateur trouvé.');
      error.statusCode = 404;
      throw error;
    }

    const swapFolder = new SwapFolder({
      userId: user._id,
      proId: req.pro._id,
      status: 'pending',
    });
    await swapFolder.save();
    user.swapFolderIds.push(swapFolder._id);
    await user.save();

    pro.swapFolderIds.push(swapFolder._id);
    await pro.save();

    if (choice === 'backHome') {
      return res.redirect('/');
    }

    await swapFolder.populate('userId').execPopulate();

    res.redirect(`/pro/add-request/${swapFolder._id}`);
  } catch (err) {
    next(err);
  }
};

exports.getAddRequest = async (req, res, next) => {
  try {
    const doctypes = await Doctype.find();
    if (!doctypes) {
      const error = new Error('Aucun type de document trouvé.');
      error.statusCode = 404;
      throw err;
    }
    res.render('pro/add-request', {
      pageTitle: 'Création de requête',
      path: '/swap-folders',
      doctypes: doctypes,
      swapFolderId: req.params.swapFolderId,
    });
  } catch (err) {
    next(err);
  }
};

exports.postAddRequest = async (req, res, next) => {
  const swapFolderId = req.body.swapFolderId;
  const request = new Request({
    swapFolderId: swapFolderId,
    isAccepted: false,
  });

  try {
    const swapFolder = await SwapFolder.findById(swapFolderId);
    swapFolder.requestIds.push(request._id);
    await swapFolder.save();
  } catch (err) {
    err.message =
      'Un problème est survenu lors de la récupération du dossier de prêt. Nous travaillons à le réparer.';
    return next(err);
  }

  const docInputs = req.body.requestedDocs;
  const docArrays = [];

  if (typeof docInputs === 'string') {
    docArrays.push(docInputs.split('///'));
  } else {
    for (let doc of docInputs) {
      docArrays.push(doc.split('///'));
    }
  }

  let docObjects = [];
  for (let doc of docArrays) {
    const doctypeId = doc[0];
    let title;
    let age;
    let docGroupId;

    if (doc[1] === '0') {
      title = null;
    } else {
      title = doc[1];
    }

    if (doc[2] === '0') {
      age = null;
    } else {
      age = +doc[2];
    }

    if (doc[3] === '0') {
      docGroupId = null;
    } else {
      docGroupId = +doc[3];
    }

    docObjects.push({
      doctypeId: doctypeId,
      title: title,
      age: age,
      docGroupId: docGroupId,
    });
  }

  const repeatedGroupIds = docObjects.map((obj) => {
    return obj.docGroupId;
  });
  const groupIds = [];
  for (const id of repeatedGroupIds) {
    if (!groupIds.includes(id)) {
      groupIds.push(id);
    }
  }

  for (let groupId of groupIds) {
    const group = docObjects.filter((obj) => {
      return obj.docGroupId === groupId;
    });
    const requestedDocs = [];
    for (let doc of group) {
      const requestedDoc = new RequestedDoc({
        requestId: request._id,
        title: doc.title,
        age: doc.age,
        doctypeId: doc.doctypeId,
      });
      requestedDocs.push(requestedDoc);
    }

    for (let requestedDoc of requestedDocs) {
      let siblingDocIds;
      if (groupId) {
        siblingDocIds = requestedDocs
          .filter((d) => {
            return d !== requestedDoc;
          })
          .map((d) => {
            return d._id;
          });
      } else {
        siblingDocIds = [];
      }
      requestedDoc.alternativeRequestedDocIds = siblingDocIds;

      try {
        await requestedDoc.save();
        request.requestedDocIds.push(requestedDoc._id);
      } catch (err) {
        err.message =
          'Un problème est survenu lors de la sauvegarde des documents requis. Nous travaillons à le réparer.';
        return next(err);
      }
    }
  }

  try {
    await request.save();
    res.redirect(`/pro/swap-folders/${swapFolderId}`);
  } catch (err) {
    if (!err.message) {
      err.message =
        'Un problème est survenu lors de la sauvegarde de votre requête. Nous travaillons à le réparer.';
    }
    next(err);
  }
};

exports.postDeleteRequest = async (req, res, next) => {
  const requestId = req.params.requestId;

  try {
    const request = await Request.findById(requestId);
    if (!request) {
      const error = new Error('Requête non trouvée.');
      error.statusCode = 404;
      throw error;
    }

    const swapFolder = await SwapFolder.findById(request.swapFolderId);
    if (!swapFolder) {
      const error = new Error('Dossier de prêt non trouvé.');
      error.statusCode = 404;
      throw error;
    }

    await RequestedDoc.deleteMany({ requestId: request._id });
    await Request.deleteOne({ _id: requestId });

    swapFolder.requestIds = swapFolder.requestIds.filter((id) => {
      return id.toString() !== requestId.toString();
    });
    await swapFolder.save();

    res.redirect(`/pro/swap-folders/${swapFolder._id}`);
  } catch (err) {
    if (!err.message) {
      err.message =
        'Un problème est survenu lors de la suppression de votre requête. Nous travaillons à le réparer.';
    }
    return next(err);
  }
};
