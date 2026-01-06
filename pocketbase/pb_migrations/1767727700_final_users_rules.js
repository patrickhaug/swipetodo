/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // Allow users to see themselves OR others in the same household
  collection.listRule = "id = @request.auth.id || (household != '' && household = @request.auth.household)"
  collection.viewRule = "id = @request.auth.id || (household != '' && household = @request.auth.household)"

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  collection.listRule = "@request.auth.id != ''"
  collection.viewRule = "@request.auth.id != ''"

  return app.save(collection)
})
