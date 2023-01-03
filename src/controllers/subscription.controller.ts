import express from "express";
import appleReceiptVerify from "node-apple-receipt-verify";
import { User } from "../models/user.model";

/*
  GET /subscription
  Get subscription status

  Request body:
    - none

  Response body:
    - error: boolean
    - message: string
    - subscriptionActive: boolean
    - subscriptionDate: Date
    - subscriptionReceipt: SubscriptionReceipt
*/
const getSubscription = async (req: express.Request, res: express.Response) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(400).json({
      error: true,
      message: "User not found",
    });
  }

  return res.status(200).json({
    error: false,
    message: "Subscription status retrieved",
    subscriptionActive: user.subscriptionActive,
    subscriptionDate: user.subscriptionDate,
    subscriptionReceipt: user.subscriptionReceipt,
    subscriptionPerks: user.subscriptionPerks,
  });
};

/*
  POST /subscription/create
  Create a new subscription

  Request body:
    - receipt: string

  Response body:
    - error: boolean
    - message: string
    - user: SanitizedUser
*/
const createSubscription = async (req: express.Request, res: express.Response) => {
  const { receipt } = req.body;

  if (!receipt) {
    return res.status(400).json({
      error: true,
      message: "Missing subscription receipt",
    });
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(400).json({
      error: true,
      message: "User not found",
    });
  }

  const products = await appleReceiptVerify.validate({
    receipt,
  });

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({
      error: true,
      message: "Invalid subscription receipt",
    });
  }

  let subscriptionReceipt = products[0];

  user.subscriptionActive = true;
  user.subscriptionReceipt = subscriptionReceipt;
  user.subscriptionDate = new Date(subscriptionReceipt.purchaseDate);

  user.subscriptionPerks = {
    ...user.subscriptionPerks,
    freeLabelsRedeemable: true,
    freeLabelsNextRedeemable: new Date(subscriptionReceipt.expirationDate),
  };

  try {
    await user.save();
  } catch {
    return res.status(500).json({
      error: true,
      message: "Error saving subscription",
    });
  }

  const sanitizedUser = user.sanitize();

  return res.json({
    error: false,
    message: "Subscription created",
    user: sanitizedUser,
  });
};

export default {
  getSubscription,
  createSubscription,
};
