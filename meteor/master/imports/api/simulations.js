import { Mongo } from 'meteor/mongo';

export const FullSimulations = new Mongo.Collection('FullSimulations', {idGeneration: 'MONGO'})