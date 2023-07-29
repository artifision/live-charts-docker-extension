import React, {useEffect, useState, useRef} from 'react';
import {createDockerDesktopClient} from '@docker/extension-api-client';
import {
  Button, ButtonGroup, debounce, Divider, Fab, FormLabel, Link,
  Stack, TextField, Typography, useTheme
} from '@mui/material';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import FormControl from '@mui/material/FormControl';
import Radio from '@mui/material/Radio';
import Tooltip from '@mui/material/Tooltip';
import RadioGroup from '@mui/material/RadioGroup';
import Box from '@mui/material/Box';
import {blue, teal, deepPurple, lime, blueGrey} from '@mui/material/colors';

import Device from "./classes/Device";
import RawContainerStats from "./interfaces/RawContainerStats";
import ContainerStats from "./classes/ContainerStats";
import Container from "./classes/Container";
import Stats from "./classes/Stats";
import ContainersCollection from "./classes/ContainersCollection";
import StatsStack from "./classes/StatsStack";
import ChartsMaker from "./ChartsMaker";
import ChartItem from "./classes/ChartItem";
import ChartData from "./classes/ChartData";
import Colors from "./classes/Colors";

const devices: Device[] = [
  new Device('CPU', 'cpu', '%', blue[400]),
  new Device('Memory', 'memory', 'MB', teal[400]),
  new Device('Disk', 'disk', 'MB', deepPurple[300]),
  new Device('Network', 'network', 'MB', lime[800]),
];

const graphMergeOptions = [
  {name: 'Overview', value: 'overview'},
  {name: 'Combine', value: 'combine'},
  {name: 'Split', value: 'split'},
];

const MAX_CHARTS: number = 12;
const MAX_CONSECUTIVE_FAILED_READS: number = 20;
const MAX_STACK_ITEMS: number = 60;
const SIDEBAR_MIN_WIDTH: number = 170;
const SIDEBAR_MAX_WIDTH: number = 500;
const SIDEBAR_DEFAULT_WIDTH: number = 223;
const SIDEBAR_WIDTH_KEY: string = 'dlc_sidebar_width';
const CONTAINERS_FILTER_KEY: string = 'dlc_containers_filter';
const colors: Colors = new Colors;

// Note: This line relies on Docker Desktop's presence as a host application.
// If you're running this React app in a browser, it won't work properly.
const client = createDockerDesktopClient();

function useDockerDesktopClient() {
  return client;
}

export function App() {
  const [runningContainers, setRunningContainers] = useState<ContainersCollection>(new ContainersCollection);
  const [filteredContainers, setFilteredContainers] = useState<ContainersCollection>(new ContainersCollection);
  const [selectedContainers, setSelectedContainers] = useState<ContainersCollection>(new ContainersCollection);
  const [selectedDevices, setSelectedDevices] = useState<Device[]>(devices);
  const [statsStack, setStatsStack] = useState<StatsStack>(new StatsStack(MAX_STACK_ITEMS));
  const [charts, setCharts] = useState<Object[]>([]);
  const [maxChartsWarningShown, setMaxChartsWarningShown] = useState<boolean>(false);
  const [statsInterval, setStatsInterval] = useState<number>(1000);
  const [frozen, setFrozen] = useState<boolean>(false);
  const [colorized, setColorized] = useState<boolean>(false);
  const [selectedGraphMergeOption, setSelectedGraphMergeOption] = useState<string>(graphMergeOptions[0].value);
  const [resizeStarted, setResizeStarted] = useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY) || '') || SIDEBAR_DEFAULT_WIDTH);
  const containersFilterDefaultValue = localStorage.getItem(CONTAINERS_FILTER_KEY) || '';
  const [containersFilter, setContainersFilter] = useState<string>(containersFilterDefaultValue);
  const [invalidFilter, setInvalidFilter] = useState<boolean>(false);
  const currentStatsRawRef = useRef<RawContainerStats[]>();
  const ddClient = useDockerDesktopClient();
  const theme = useTheme();

  colors.setUseLightPalette(theme.palette.mode === 'dark');

  useEffect(() => {
    identifyRunningContainers();
  }, []);

  const identifyRunningContainers = () => {
    ddClient.docker.cli.exec('ps', ['--format', '"{{json .}}"']).then((result) => {
      const runningContainers = new ContainersCollection;
      colors.reset();
      result.parseJsonLines()
        .sort((a: any, b: any) => a.Names.localeCompare(b.Names))
        .map((line) => {
        runningContainers.addContainer(new Container(line.ID, line.Names, colors.pop()));
      });

      setRunningContainers(runningContainers);
    });
  }

  useEffect(() => {
    if (!runningContainers.hasContainers()) {
      setFilteredContainers(new ContainersCollection);
      setSelectedContainers(new ContainersCollection);
      return;
    }

    const filteredContainers = new ContainersCollection
    runningContainers.getContainers().map((container: Container) => {
      if (container.getName().match(containersFilter)) {
        filteredContainers.addContainer(container);
      }
    });

    setSelectedContainers((previouslySelectedContainers: ContainersCollection) => {
      const newSelectedContainers: ContainersCollection = new ContainersCollection;
      filteredContainers.map((container: Container) => {
        if (!previouslySelectedContainers.hasContainers() || previouslySelectedContainers.containsContainer(container)) {
          newSelectedContainers.addContainer(container);
        }
      });

      return newSelectedContainers;
    });
    setFilteredContainers(filteredContainers);
  }, [runningContainers, containersFilter]);

  const makeStatsFromRaw = (rawStats: Array<RawContainerStats>): Stats => {
    const currentTime: string = new Date().toLocaleTimeString([], {
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const stats: Stats = new Stats(currentTime);

    rawStats.map((rawContainerStats: RawContainerStats): void => {
      if (runningContainers) {
        stats.addContainerStats(new ContainerStats(currentTime, runningContainers.getContainerByName(rawContainerStats.Name), rawContainerStats))
      }
    });

    return stats;
  }

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const rawStats = currentStatsRawRef.current;
      if (undefined !== rawStats) {
        if (containersChanged(runningContainers, rawStats)) {
          identifyRunningContainers();
          return;
        }
        const stats: Stats = makeStatsFromRaw(rawStats);
        setStatsStack((stack: StatsStack): StatsStack => stack.addUniqueStats(stats).clone());
      }
    }, statsInterval);

    return () => clearInterval(updateInterval);
  }, [statsInterval, runningContainers]);

  const containersChanged = (runningContainers: ContainersCollection, identifiedContainers: RawContainerStats[]): boolean => {
    const runningContainersNames: string[] = runningContainers.getContainers().map((container: Container) => container.getName());
    const identifiedContainersNames: string[] = identifiedContainers.map((container: RawContainerStats) => container.Name);

    return runningContainersNames.sort().toString() !== identifiedContainersNames.sort().toString();
  }

  useEffect((): void => {
    const chartsMaker: ChartsMaker = new ChartsMaker;
    let chartsCount: number = 0;

    if (frozen) {
      return;
    }

    if (!selectedContainers.hasContainers() || !selectedDevices) {
      setCharts([]);
      return;
    }
    let chartsLimitReached: boolean = false;

    selectedDevices.forEach((selectedDevice: Device): void => {
      selectedDevice.setUseContainerColor(colorized);
    });

    if (selectedGraphMergeOption === 'split') {
      selectedDevices.forEach((selectedDevice: Device) => {
        selectedContainers.forEach((selectedContainer: Container) => {
          const chartItems: ChartItem[] = statsStack?.getStats().map((stats: Stats) => {
            return selectedDevice.makeSplitChartItem(stats.getContainerStats(selectedContainer));
          });

          const chartData: ChartData = new ChartData(chartItems);

          if (chartData.hasItems()) {
            if (chartsCount++ < MAX_CHARTS) {
              chartsMaker.addChart(selectedDevice, chartData);
            } else {
              chartsLimitReached = true;
            }
          }
        });
      });
    } else if (selectedGraphMergeOption === 'combine') {
      selectedDevices.forEach((selectedDevice: Device): void => {
        const chartItems: ChartItem[] = statsStack.getStats().map((stats: Stats): ChartItem => {
          return selectedDevice.makeCombinedChartItem(stats, selectedContainers);
        });

        const chartData: ChartData = new ChartData(chartItems);
        if (chartData.hasItems()) {
          if (chartsCount++ < MAX_CHARTS) {
            chartsMaker.addCombinedChart(selectedDevice, chartData);
          } else {
            chartsLimitReached = true;
          }
        }
      });
    } else if (selectedGraphMergeOption === 'overview') {
      selectedDevices.forEach((selectedDevice: Device): void => {
        const chartItems: ChartItem[] = statsStack.getStats().map((stats: Stats): ChartItem => {
          return selectedDevice.makeOverviewChartItem(stats, selectedContainers);
        });

        const chartData: ChartData = new ChartData(chartItems);
        if (chartData.hasItems()) {
          if (chartsCount++ < MAX_CHARTS) {
            chartsMaker.addChart(selectedDevice, chartData);
          } else {
            chartsLimitReached = true;
          }
        }
      });
    }

    if (chartsLimitReached && !maxChartsWarningShown) {
      ddClient.desktopUI.toast.success(`Too many charts to display. Showing only ${MAX_CHARTS} charts.`);
      setMaxChartsWarningShown(true);
    }

    setCharts(chartsMaker.getCharts());
  }, [selectedDevices, selectedContainers, selectedGraphMergeOption, statsStack, frozen, colorized]);

  useEffect(() => {
    let consecutiveFailedReads: number = 0;
    const statsStream = ddClient.docker.cli.exec('stats', ['--format', '{{json .}}'], {
      stream: {
        onOutput(data) {
          if (data.stdout) {
            const lines: string[] = data.stdout.toString().trim().split('\n');
            let rawParsedData = null;
            try {
              rawParsedData = lines.map((line: string) => JSON.parse(line));
              consecutiveFailedReads = 0;
            } catch (e: any) {
              consecutiveFailedReads++;
              rawParsedData = null;
            }

            if (consecutiveFailedReads > MAX_CONSECUTIVE_FAILED_READS) {
              identifyRunningContainers();
              consecutiveFailedReads = 0;
            }

            if (rawParsedData && rawParsedData.length > 0) {
              currentStatsRawRef.current = rawParsedData;
            }
          } else {
            console.error('Failed to parse', data.stdout);
          }
        },
        onError(error: any) {
          console.error(error);
        },
        splitOutputLines: false,
      }
    });

    return () => statsStream.close();
  }, []);

  const handleStatsOptionChange = (event: React.SyntheticEvent, checked: boolean): void => {
    const selectedValue: string = (event.target as HTMLInputElement).value;

    if (selectedDevices.some(s => s.getKey() === selectedValue)) {
      setSelectedDevices(prev => prev.filter((device: Device): boolean => device.getKey() !== selectedValue))
    } else {
      setSelectedDevices((prev: Device[]): Device[] => {
        const selectedDevice = devices.find((device: Device): boolean => device.getKey() === selectedValue);
        if (selectedDevice) {
          return [...prev, selectedDevice];
        }

        return prev;
      });
    }
  }

  const handleContainerSelectChange = (event: React.SyntheticEvent, checked: boolean): void => {
    const selectedContainerID = (event.target as HTMLInputElement).value;

    setSelectedContainers((selectedContainers: ContainersCollection) => {
      if (checked) {
        selectedContainers.addContainer(runningContainers.getContainerById(selectedContainerID));
      } else {
        selectedContainers.removeContainerByID(selectedContainerID);
      }
      return selectedContainers;
    });
  }

  const resizeSidebar = (event: React.MouseEvent): void => {
    if (!resizeStarted) {
      return;
    }
    setSidebarWidth(previousWidth => {
      let newWidth: number = previousWidth + event.movementX;
      if (newWidth < SIDEBAR_MIN_WIDTH) {
        newWidth = SIDEBAR_MIN_WIDTH;
      } else if (newWidth > SIDEBAR_MAX_WIDTH) {
        newWidth = SIDEBAR_MAX_WIDTH;
      }

      localStorage.setItem('dlc_sidebar_width', newWidth.toString());

      return newWidth;
    });
  }

  const handleFilterChange = debounce((event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      new RegExp(event.target.value);
    } catch(e) {
      setInvalidFilter(true);
      return;
    }
    setInvalidFilter(false);
    setContainersFilter(event.target.value);
    localStorage.setItem(CONTAINERS_FILTER_KEY, event.target.value);
  }, 1000);

  const shuffleColors = () => {
    colors.reset().shuffle();

    setRunningContainers((runningContainers: ContainersCollection) => {
      runningContainers.getContainers().map((container: Container) => {
        container.setColor(colors.pop());
      });

      return runningContainers;
    });
  }

  return (
    <Stack spacing={1}
           onMouseUp={() => setResizeStarted(false)}
           onMouseLeave={() => setResizeStarted(false)}
           onMouseMove={resizeSidebar}
           sx={{userSelect: 'none'}}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          backgroundColor: theme.palette.mode === 'dark' ? blueGrey[900] : blueGrey[50],
          border: '1px solid',
          borderRadius: 1,
          borderColor: theme.palette.mode === 'dark' ? blueGrey[800] : blueGrey[100],
          paddingX: 2,
          paddingY: 1,
        }}
      >
        <Stack alignItems="center">
          <Typography variant="h3">Live Charts</Typography>
          <Typography variant="body2">
            by <Link href="#" onClick={() => ddClient.host.openExternal('https://artifision.com')}>Artifision</Link>
          </Typography>
        </Stack>
        <Stack direction="row">
          <Divider orientation="vertical" variant="middle" flexItem/>
          <FormControl component="fieldset" sx={{marginX: 5}}>
            <FormGroup aria-label="position" row>
              {devices.map((device: Device) => (
                <FormControlLabel
                  key={device.getKey()}
                  value={device.getKey()}
                  control={<Switch color="primary"
                                   checked={selectedDevices.some(s => s.getKey() === device.getKey())}/>}
                  label={<Typography variant={'h3'} color={device.getColor()}>{device.getName()}</Typography>}
                  labelPlacement="top"
                  onChange={handleStatsOptionChange}
                />
              ))}
            </FormGroup>
          </FormControl>
          <Divider orientation="vertical" variant="middle" flexItem/>
        </Stack>
        <Stack>
          <Link href="#" onClick={() => ddClient.host.openExternal("https://forms.gle/LVQEgXfVuB3mgHDKA")}>
            Give Feedback <QuestionAnswerIcon />
          </Link>
        </Stack>
      </Stack>

      <Stack direction="row">
        <Stack
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            backgroundColor: theme.palette.mode === 'dark' ? blueGrey[900] : blueGrey[50],
            border: '1px solid',
            borderRadius: 1,
            borderColor: theme.palette.mode === 'dark' ? blueGrey[800] : blueGrey[100],
            padding: 2,
          }}>
          <FormControl>
            <Typography variant="h4">Types:</Typography>
            <Divider/>
            <RadioGroup>
              {graphMergeOptions.map(option => (
                <FormControlLabel key={option.value} value={option.value} control={
                  <Radio checked={selectedGraphMergeOption === option.value}
                         size="medium"
                         onChange={() => setSelectedGraphMergeOption(option.value)}/>
                } label={option.name}/>
              ))}
            </RadioGroup>
          </FormControl>
          <Typography sx={{marginTop: 4}} variant="h4">Options:</Typography>
          <Divider />
          <Stack direction="row" spacing={1}>
            <Tooltip placement="right" title={frozen ? 'Unfreeze' : 'Freeze'}>
              <Fab color={frozen ? 'error' : 'primary'} size="small" onClick={() => setFrozen(!frozen)}>
                <AcUnitIcon/>
              </Fab>
            </Tooltip>
            {selectedGraphMergeOption !== 'overview' &&
              <>
                <Tooltip placement="right" title={colorized ? 'Remove Containers Colors' : 'Colorize Containers'}>
                  <Fab color={colorized ? 'warning' : 'primary'} size="small" onClick={() => setColorized(!colorized)}>
                    <ColorLensIcon/>
                  </Fab>
                </Tooltip>
                {colorized && <Tooltip placement="right" title="Shuffle Colors">
                  <Fab color="success" size="small" onClick={shuffleColors}>
                    <ShuffleIcon/>
                  </Fab>
                </Tooltip>
                }
              </>
            }
          </Stack>
          <FormControl sx={{marginTop: 4}}>
            <Typography variant="h4">Containers:</Typography>
            <Divider/>
            <TextField label="Filter (RegExp)" sx={{marginBottom: 1}} error={invalidFilter} helperText={invalidFilter ? 'Invalid RegExp' : ''}
                       InputProps={{startAdornment: '/', endAdornment: '/'}} defaultValue={containersFilterDefaultValue}
                       onChange={handleFilterChange}
            />
            <Box sx={{marginBottom: 2}}>
                <ButtonGroup variant="outlined" size="small" sx={{height: 25}}>
                  <Tooltip title="Deselect all containers" placement="right" enterDelay={1000}>
                    <Button onClick={() => setSelectedContainers(new ContainersCollection)}><ToggleOffIcon/></Button>
                  </Tooltip>
                  <Tooltip title="Select all containers" placement="right" enterDelay={1000}>
                    <Button onClick={() => setSelectedContainers(filteredContainers.clone())}><ToggleOnIcon/></Button>
                  </Tooltip>
                </ButtonGroup>
            </Box>
            <FormGroup>
              {filteredContainers?.map((container: Container) =>
                <Tooltip key={container.getID()} title={container.getName()} placement="right">
                  <FormControlLabel
                    sx={{marginLeft: '-12px', marginRight: 0}}
                    value={container.getID()}
                    control={<Switch checked={selectedContainers.containsContainer(container)} size="small"/>}
                    label={<Typography
                    sx={{
                      width: sidebarWidth - 80,
                      fontWeight: 'bold',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      color: colorized && selectedGraphMergeOption !== 'overview' ? container.getColor() : 'inherit',
                    }}
                    >{container.getName()}</Typography>}
                    onChange={handleContainerSelectChange}
                  />
                </Tooltip>
              )}
              {!runningContainers.hasContainers() &&
                <FormLabel>No Containers Running.</FormLabel>
              }
            </FormGroup>
          </FormControl>
        </Stack>

        <Stack sx={{marginLeft: '-8px', cursor: 'col-resize'}} onMouseDown={() => setResizeStarted(true)}>
          <Box sx={{
            borderRight: '2px solid',
            flexGrow: 1,
            borderRadius: 10,
            width: '9px',
            borderColor: theme.palette.mode === 'dark' ? blueGrey[800] : blueGrey[100],
            '&:hover': {
              borderColor: theme.palette.mode === 'dark' ? blueGrey[600] : blueGrey[300],
            }
          }}>
          </Box>
        </Stack>

        <Stack sx={{flexGrow: 1, width: '1px'}}>
          {runningContainers.hasContainers() && charts.map((chart: any) =>
            <Box key={chart.key} sx={{minHeight: '200px'}}>{chart.chart}</Box>
          )}
          {!runningContainers.hasContainers() &&
            <Typography variant="h4" sx={{alignSelf: 'center', m: 10}}>No Containers Running.</Typography>
          }
        </Stack>
      </Stack>
    </Stack>
  );
}
