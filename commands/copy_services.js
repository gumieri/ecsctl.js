const AWS = require('aws-sdk')

const ecs = new AWS.ECS({ apiVersion: '2014-11-13' })

const fatal = err => {
  console.log(err.message)
  return process.exit(1)
}

module.exports = (servicesToCopy, flags) =>
  ecs.describeClusters({ clusters: [flags.toCluster] }, (err, { clusters }) => {
    if (err) return fatal(err)

    if (clusters.length === 0) {
      return fatal(new Error('Target cluster not found'))
    }

    let cluster = clusters[0]

    if (servicesToCopy.length === 0) {
      return fatal(new Error('No service found'))
    }

    return ecs.describeServices(
      { cluster: flags.cluster, services: servicesToCopy },
      (err, { services }) => {
        if (err) return fatal(err)

        services.forEach(service => {
          let newService = {
            cluster: cluster.clusterName,
            desiredCount: service.desiredCount,
            loadBalancers: service.loadBalancers,
            serviceName: service.serviceName,
            taskDefinition: service.taskDefinition
          }

          if (!flags.deploy) {
            console.log(JSON.stringify(newService, null, 2))
            return process.exit()
          }

          ecs.createService(newService, (err, data) => {
            if (err) return fatal(err)

            console.log(`${service.serviceName} copied successfully!`)
          })
        })
      }
    )
  })
