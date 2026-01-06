/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // Update rules to use ?= for relation comparison
  collection.listRule = "id = @request.auth.id || (household != '' && household ?= @request.auth.household)"
  collection.viewRule = "id = @request.auth.id || (household != '' && household ?= @request.auth.household)"

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // Revert to original rules
  collection.listRule = "id = @request.auth.id || (household != '' && household = @request.auth.household)"
  collection.viewRule = "id = @request.auth.id || (household != '' && household = @request.auth.household)"

  return app.save(collection)
})
