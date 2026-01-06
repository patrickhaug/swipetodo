/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_113564862")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != '' && @request.auth.household = @request.body.household"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_113564862")

  // update collection data
  unmarshal({
    "createRule": null
  }, collection)

  return app.save(collection)
})
