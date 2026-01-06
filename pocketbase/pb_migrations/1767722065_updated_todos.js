/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_113564862")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id != \"\"",
    "listRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_113564862")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != '' && @request.auth.household = @request.body.household",
    "deleteRule": "@request.auth.id != '' && @request.auth.household = household",
    "listRule": "@request.auth.id != '' && @request.auth.household = household",
    "updateRule": "@request.auth.id != '' && @request.auth.household = household",
    "viewRule": "@request.auth.id != '' && @request.auth.household = household"
  }, collection)

  return app.save(collection)
})
