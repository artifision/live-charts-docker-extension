# Live Charts

Live Charts provides real-time visualization of critical system metrics. With Live Charts, you can effortlessly monitor and track the current usage of CPU, Memory, Disk, and Network resources within your Docker containers. The extension offers intuitive and interactive charts that dynamically update to reflect the most recent data, enabling you to make informed decisions and optimize your containerized environment. Stay on top of your system's performance with Live Charts and gain valuable insights into resource utilization, empowering you to efficiently manage your Docker infrastructure.

## Local development

You can use `docker` to build, install and push your extension. Also, we provide an opinionated [Makefile](Makefile) that could be convenient for you. There isn't a strong preference of using one over the other, so just use the one you're most comfortable with.

To build the extension, use `make build-extension` **or**:

```shell
  docker buildx build -t artifision/live-charts-docker-extension:latest . --load
```

To install the extension, use `make install-extension` **or**:

```shell
  docker extension install artifision/live-charts-docker-extension:latest
```

> If you want to automate this command, use the `-f` or `--force` flag to accept the warning message.

To preview the extension in Docker Desktop, open Docker Dashboard once the installation is complete. The left-hand menu displays a new tab with the name of your extension. You can also use `docker extension ls` to see that the extension has been installed successfully.

### Frontend development

During the development of the frontend part, it's helpful to use hot reloading to test your changes without rebuilding your entire extension. To do this, you can configure Docker Desktop to load your UI from a development server.
Assuming your app runs on the default port, start your UI app and then run:

```shell
  cd ui
  npm install
  npm run dev
```

This starts a development server that listens on port `3000`.

You can now tell Docker Desktop to use this as the frontend source. In another terminal run:

```shell
  docker extension dev ui-source artifision/live-charts-docker-extension:latest http://localhost:3000
```

In order to open the Chrome Dev Tools for your extension when you click on the extension tab, run:

```shell
  docker extension dev debug artifision/live-charts-docker-extension:latest
```

Each subsequent click on the extension tab will also open Chrome Dev Tools. To stop this behaviour, run:

```shell
  docker extension dev reset artifision/live-charts-docker-extension:latest
```

### Clean up

To remove the extension:

```shell
docker extension rm artifision/live-charts-docker-extension:latest
```

### License
The Live Charts is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

### Credits
[Logo created by Freepik - Flaticon](https://www.flaticon.com/free-icons/line-chart)
